package routing

import (
	"net/http"
	"time"

	"github.com/hyprmcp/jetski/internal/mail"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/hyprmcp/jetski/internal/frontend"
	"github.com/hyprmcp/jetski/internal/handlers"
	"github.com/hyprmcp/jetski/internal/middleware"
	"github.com/hyprmcp/jetski/internal/tracers"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

func NewRouter(
	logger *zap.Logger,
	db *pgxpool.Pool,
	tracers *tracers.Tracers,
	jwkSet jwk.Set,
	mailer mail.Mailer,
	k8sClient client.Client,
) http.Handler {
	router := chi.NewRouter()
	router.Use(
		// Handles panics
		chimiddleware.Recoverer,
		// Reject bodies larger than 1MiB
		chimiddleware.RequestSize(1048576),
	)
	router.Mount("/api", ApiRouter(logger, db, tracers, jwkSet, mailer, k8sClient))
	router.Mount("/internal", InternalRouter())
	router.Mount("/webhook", WebhookRouter(logger, db))
	router.Mount("/", FrontendRouter())
	return router
}

func ApiRouter(
	logger *zap.Logger,
	db *pgxpool.Pool,
	tracers *tracers.Tracers,
	jwkSet jwk.Set,
	mailer mail.Mailer,
	k8sClient client.Client,
) http.Handler {
	r := chi.NewRouter()
	r.Use(
		chimiddleware.RequestID,
		chimiddleware.RealIP,
		middleware.Sentry,
		middleware.LoggerCtxMiddleware(logger),
		middleware.LoggingMiddleware,
		middleware.ContextInjectorMiddleware(db, mailer),
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

		r.Route("/context", handlers.ContextRouter)
		r.Route("/organizations", handlers.OrganizationsRouter)
		r.Route("/projects", handlers.ProjectsRouter(k8sClient))
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
		middleware.ContextInjectorMiddleware(db, nil),
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
