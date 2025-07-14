package routing

import (
	"context"
	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jetski-sh/jetski/internal/frontend"
	"github.com/jetski-sh/jetski/internal/handlers"
	"github.com/jetski-sh/jetski/internal/middleware"
	"github.com/jetski-sh/jetski/internal/tracers"
	"go.uber.org/zap"
	"net/http"
	"strings"
)

func NewRouter(
	logger *zap.Logger, db *pgxpool.Pool, tracers *tracers.Tracers,
) http.Handler {
	router := chi.NewRouter()
	router.Use(
		// Handles panics
		chimiddleware.Recoverer,
		// Reject bodies larger than 1MiB
		chimiddleware.RequestSize(1048576),
	)
	router.Mount("/api", ApiRouter(logger, db, tracers))
	router.Mount("/internal", InternalRouter())
	router.Mount("/", FrontendRouter())
	return router
}

func ApiRouter(
	logger *zap.Logger, db *pgxpool.Pool, tracers *tracers.Tracers,
) http.Handler {
	r := chi.NewRouter()
	r.Use(
		chimiddleware.RequestID,
		chimiddleware.RealIP,
		// middleware.Sentry,
		middleware.LoggerCtxMiddleware(logger),
		// middleware.LoggingMiddleware,
		middleware.ContextInjectorMiddleware(db),
	)

	provider, err := oidc.NewProvider(context.Background(), "http://localhost:5556/dex")
	if err != nil {
		// handle error
	}
	verifier := provider.Verifier(&oidc.Config{ClientID: "ui"})

	r.Route("/v1", func(r chi.Router) {
		r.Use(
		/*middleware.OTEL(tracers.Default()),
		  middleware.SentryUser,
		  // TODO auth auth.Authentication.Middleware,
		  httprate.Limit(30, 1*time.Second, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),
		  httprate.Limit(60, 1*time.Minute, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),
		  httprate.Limit(2000, 1*time.Hour, httprate.WithKeyFuncs(middleware.RateLimitUserIDKey)),*/
		)

		r.Get("/whoami", func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			var rawIDToken string
			parts := strings.Split(authHeader, "Bearer ")
			if len(parts) == 2 {
				rawIDToken = parts[1]
			}
			idToken, err := verifier.Verify(context.Background(), rawIDToken)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			var claims struct {
				Email string `json:"email"`
			}
			if err := idToken.Claims(&claims); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}

			w.WriteHeader(200)
			w.Write([]byte(claims.Email))
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
