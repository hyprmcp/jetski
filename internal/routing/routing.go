package routing

import (
	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jetski-sh/jetski/internal/frontend"
	"github.com/jetski-sh/jetski/internal/handlers"
	"github.com/jetski-sh/jetski/internal/middleware"
	"github.com/jetski-sh/jetski/internal/tracers"
	"go.uber.org/zap"
	"net/http"
	"time"
)

func NewRouter(
	logger *zap.Logger, db *pgxpool.Pool, tracers *tracers.Tracers, oidcProvider *oidc.Provider,
) http.Handler {
	router := chi.NewRouter()
	router.Use(
		// Handles panics
		chimiddleware.Recoverer,
		// Reject bodies larger than 1MiB
		chimiddleware.RequestSize(1048576),
	)
	router.Mount("/api", ApiRouter(logger, db, tracers, oidcProvider))
	router.Mount("/internal", InternalRouter())
	router.Mount("/", FrontendRouter())
	return router
}

func ApiRouter(
	logger *zap.Logger, db *pgxpool.Pool, tracers *tracers.Tracers, oidcProvider *oidc.Provider,
) http.Handler {
	r := chi.NewRouter()
	r.Use(
		chimiddleware.RequestID,
		chimiddleware.RealIP,
		middleware.Sentry,
		middleware.LoggerCtxMiddleware(logger),
		middleware.LoggingMiddleware,
		middleware.ContextInjectorMiddleware(db),
		middleware.AuthMiddleware(oidcProvider),
	)

	r.Route("/v1", func(r chi.Router) {
		r.Use(
			middleware.OTEL(tracers.Default()),
			middleware.SentryUser,
			httprate.Limit(30, 1*time.Second, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),
			httprate.Limit(60, 1*time.Minute, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),
			httprate.Limit(2000, 1*time.Hour, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),
		)

		r.Get("/whoami", func(w http.ResponseWriter, r *http.Request) {
			user := middleware.GetUserAuthInfo(r.Context())
			_, _ = w.Write([]byte(user.Email))
		})

		// TODO routes
	})

	return r
}

func InternalRouter() http.Handler {
	router := chi.NewRouter()
	router.Route("/", handlers.InternalRouter)
	return router
}

func FrontendRouter() http.Handler {
	router := chi.NewRouter()
	router.Use(
		chimiddleware.Compress(5, "text/html", "text/css", "text/javascript"),
	)

	router.Handle("/*", handlers.StaticFileHandler(frontend.BrowserFS()))

	return router
}
