package routing

import (
	"github.com/lestrrat-go/jwx/v3/jwk"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jetski-sh/jetski/internal/frontend"
	"github.com/jetski-sh/jetski/internal/handlers"
	"github.com/jetski-sh/jetski/internal/middleware"
	"github.com/jetski-sh/jetski/internal/tracers"
	"go.uber.org/zap"
)

func NewRouter(
	logger *zap.Logger, db *pgxpool.Pool, tracers *tracers.Tracers, jwkSet jwk.Set,
) http.Handler {
	router := chi.NewRouter()
	router.Use(
		// Handles panics
		chimiddleware.Recoverer,
		// Reject bodies larger than 1MiB
		chimiddleware.RequestSize(1048576),
	)
	router.Mount("/api", ApiRouter(logger, db, tracers, jwkSet))
	router.Mount("/internal", InternalRouter())
	router.Mount("/webhook", WebhookRouter(logger, db))
	router.Mount("/", FrontendRouter())
	return router
}

func ApiRouter(
	logger *zap.Logger, db *pgxpool.Pool, tracers *tracers.Tracers, jwkSet jwk.Set,
) http.Handler {
	r := chi.NewRouter()
	r.Use(
		chimiddleware.RequestID,
		chimiddleware.RealIP,
		middleware.Sentry,
		middleware.LoggerCtxMiddleware(logger),
		middleware.LoggingMiddleware,
		middleware.ContextInjectorMiddleware(db),
		middleware.AuthMiddleware(jwkSet),
	)

	r.Route("/v1", func(r chi.Router) {
		r.Use(
			middleware.OTEL(tracers.Default()),
			middleware.SentryUser,
			httprate.Limit(30, 1*time.Second, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),
			httprate.Limit(60, 1*time.Minute, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),
			httprate.Limit(2000, 1*time.Hour, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),
		)

		r.Route("/organizations", handlers.OrganizationsRouter)
		r.Route("/projects", handlers.ProjectsRouter)
		r.Route("/dashboard", handlers.DashboardRouter)
	})

	return r
}

func InternalRouter() http.Handler {
	router := chi.NewRouter()
	router.Route("/", handlers.InternalRouter)
	return router
}

func WebhookRouter(logger *zap.Logger, db *pgxpool.Pool) http.Handler {
	// TODO: Webhooks should either be authenticated or exposed on a separate port that is not publicly accessible.
	router := chi.NewRouter()
	router.Use(
		chimiddleware.RequestID,
		chimiddleware.RealIP,
		middleware.Sentry,
		middleware.LoggerCtxMiddleware(logger),
		middleware.LoggingMiddleware,
		middleware.ContextInjectorMiddleware(db),
	)
	router.Route("/", handlers.WebhookRouter)
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
