package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/getsentry/sentry-go"
	sentryhttp "github.com/getsentry/sentry-go/http"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jetski-sh/jetski/internal/apierrors"
	"github.com/jetski-sh/jetski/internal/auth"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"github.com/jetski-sh/jetski/internal/env"
	"github.com/jetski-sh/jetski/internal/types"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

func ContextInjectorMiddleware(
	db *pgxpool.Pool,
) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			ctx = internalctx.WithDb(ctx, db)
			ctx = internalctx.WithRequestIPAddress(ctx, r.RemoteAddr)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func LoggerCtxMiddleware(logger *zap.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			logger := logger.With(zap.String("requestId", middleware.GetReqID(r.Context())))
			ctx := internalctx.WithLogger(r.Context(), logger)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func LoggingMiddleware(handler http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		now := time.Now()
		handler.ServeHTTP(ww, r)
		elapsed := time.Since(now)
		logger := internalctx.GetLogger(r.Context())
		logger.Info("handling request",
			zap.String("method", r.Method),
			zap.String("path", r.URL.Path),
			zap.Int("status", ww.Status()),
			zap.String("time", elapsed.String()))
	}
	return http.HandlerFunc(fn)
}

func AuthMiddleware(oidcProvider *oidc.Provider) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			logger := internalctx.GetLogger(ctx)
			authHeader := r.Header.Get("Authorization")
			var rawIDToken string
			parts := strings.Split(authHeader, "Bearer ")
			if len(parts) == 2 {
				rawIDToken = parts[1]
			}
			verifier := oidcProvider.Verifier(&oidc.Config{ClientID: env.OIDCClientID()})
			idToken, err := verifier.Verify(ctx, rawIDToken)
			if err != nil {
				logger.Info("failed to verify token", zap.Error(err))
				http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
				return
			}
			var claims auth.UserAuthInfo
			if err := idToken.Claims(&claims); err != nil {
				logger.Error("failed to parse token claims", zap.Error(err))
				// TODO sentry
				http.Error(w, "failed to parse token claims", http.StatusUnauthorized)
				return
			}
			var user *types.UserAccount
			if user, err = db.GetUserByEmail(ctx, claims.Email); err != nil {
				if errors.Is(err, apierrors.ErrNotFound) {
					logger.Info("no user found for email", zap.Error(err), zap.String("email", claims.Email))
					http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
					return
				}
				logger.Error("failed to get user by email", zap.Error(err), zap.String("email", claims.Email))
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
				// TODO sentry
				return
			}
			ctx = internalctx.WithUserAuthInfo(ctx, &claims)
			ctx = internalctx.WithUser(ctx, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

var Sentry = sentryhttp.New(sentryhttp.Options{Repanic: true}).Handle

func SentryUser(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		if hub := sentry.GetHubFromContext(ctx); hub != nil {
			user := internalctx.GetUserAuthInfo(ctx)
			hub.Scope().SetUser(sentry.User{
				ID:    user.Subject,
				Email: user.Email,
			})
		}
		h.ServeHTTP(w, r)
	})
}

func RateLimitUserIDKey(r *http.Request) (string, error) {
	user := internalctx.GetUserAuthInfo(r.Context())
	return user.Subject, nil
}

func SetRequestPattern(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
		if r.Pattern == "" {
			r.Pattern = chi.RouteContext(r.Context()).RoutePattern()
		}
	})
}

func OTEL(provider trace.TracerProvider) func(next http.Handler) http.Handler {
	mw := otelhttp.NewMiddleware(
		"",
		otelhttp.WithTracerProvider(provider),
		otelhttp.WithSpanNameFormatter(
			func(operation string, r *http.Request) string {
				var b strings.Builder
				if operation != "" {
					b.WriteString(operation)
					b.WriteString(" ")
				}
				b.WriteString(r.Method)
				if r.Pattern != "" {
					b.WriteString(" ")
					b.WriteString(r.Pattern)
				}
				return b.String()
			},
		),
	)
	return func(next http.Handler) http.Handler {
		return mw(SetRequestPattern(next))
	}
}
