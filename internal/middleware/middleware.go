package middleware

import (
	sentryhttp "github.com/getsentry/sentry-go/http"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"net/http"
	"strings"
	"time"
)

func ContextInjectorMiddleware(
	db *pgxpool.Pool,
) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			ctx = withDb(ctx, db)
			ctx = withRequestIPAddress(ctx, r.RemoteAddr)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func LoggerCtxMiddleware(logger *zap.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			logger := logger.With(zap.String("requestId", middleware.GetReqID(r.Context())))
			ctx := withLogger(r.Context(), logger)
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
		logger := GetLogger(r.Context())
		logger.Info("handling request",
			zap.String("method", r.Method),
			zap.String("path", r.URL.Path),
			zap.Int("status", ww.Status()),
			zap.String("time", elapsed.String()))
	}
	return http.HandlerFunc(fn)
}

var Sentry = sentryhttp.New(sentryhttp.Options{Repanic: true}).Handle

/*
func SentryUser(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		if hub := sentry.GetHubFromContext(ctx); hub != nil {
			if auth, err := auth.Authentication.Get(ctx); err == nil {
				hub.Scope().SetUser(sentry.User{
					ID:    auth.CurrentUserID().String(),
					Email: auth.CurrentUserEmail(),
				})
			}
		}
		h.ServeHTTP(w, r)
	})
}


func RateLimitUserIDKey(r *http.Request) (string, error) {
	if auth, err := auth.Authentication.Get(r.Context()); err != nil {
		return "", err
	} else {
		return getTokenIdKey(auth.Token(), auth.CurrentUserID()), nil
	}
}

func RateLimitCurrentDeploymentTargetIdKeyFunc(r *http.Request) (string, error) {
	if auth, err := auth.AgentAuthentication.Get(r.Context()); err != nil {
		return "", err
	} else {
		return getTokenIdKey(auth.Token(), auth.CurrentDeploymentTargetID()), nil
	}
}

func getTokenIdKey(token any, id uuid.UUID) string {
	prefix := ""
	switch token.(type) {
	case jwt.Token:
		prefix = "jwt"
	case authkey.Key:
		prefix = "authkey"
	default:
		panic("unknown token type")
	}
	return fmt.Sprintf("%v-%v", prefix, id)
}

*/

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
