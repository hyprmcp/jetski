package middleware

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"net/http"
)

func ContextInjectorMiddleware(
	db *pgxpool.Pool,
) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			/*ctx = internalctx.WithDb(ctx, db)
			  ctx = internalctx.WithMailer(ctx, mailer)
			  ctx = internalctx.WithRequestIPAddress(ctx, r.RemoteAddr)
			  ctx = internalctx.WithOIDCer(ctx, oidcer)*/
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func LoggerCtxMiddleware(logger *zap.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			//logger := logger.With(zap.String("requestId", middleware.GetReqID(r.Context())))
			//ctx := internalctx.WithLogger(r.Context(), logger)
			next.ServeHTTP(w, r) // r.WithContext(ctx))
		})
	}
}

/*func LoggingMiddleware(handler http.Handler) http.Handler {
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

func UserRoleMiddleware(userRole types.UserRole) func(handler http.Handler) http.Handler {
	return func(handler http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			if auth, err := auth.Authentication.Get(ctx); err != nil {
				http.Error(w, err.Error(), http.StatusForbidden)
			} else if auth.CurrentUserRole() == nil || *auth.CurrentUserRole() != userRole {
				http.Error(w, "insufficient permissions", http.StatusForbidden)
			} else {
				handler.ServeHTTP(w, r)
			}
		}
		return http.HandlerFunc(fn)
	}
}

var Sentry = sentryhttp.New(sentryhttp.Options{Repanic: true}).Handle

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

func AgentSentryUser(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		if hub := sentry.GetHubFromContext(ctx); hub != nil {
			if auth, err := auth.AgentAuthentication.Get(ctx); err == nil {
				hub.Scope().SetUser(sentry.User{
					ID: auth.CurrentDeploymentTargetID().String(),
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

var RequireOrgAndRole = auth.Authentication.ValidatorMiddleware(func(value *authinfo.DbAuthInfo) error {
	if value.CurrentOrgID() == nil || value.CurrentOrg() == nil || value.CurrentUserRole() == nil {
		return authn.ErrBadAuthentication
	} else {
		return nil
	}
})

func FeatureFlagMiddleware(feature types.Feature) func(handler http.Handler) http.Handler {
	return func(handler http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			if auth, err := auth.Authentication.Get(ctx); err != nil {
				http.Error(w, err.Error(), http.StatusForbidden)
			} else {
				org := auth.CurrentOrg()
				if !org.HasFeature(feature) {
					http.Error(w, fmt.Sprintf("%v not enabled for organization", feature), http.StatusForbidden)
				} else {
					handler.ServeHTTP(w, r)
				}
			}
		}
		return http.HandlerFunc(fn)
	}
}

var LicensingFeatureFlagEnabledMiddleware = FeatureFlagMiddleware(types.FeatureLicensing)

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
*/
