package webhook

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/hyprmcp/jetski/internal/db/queryable"
	"github.com/hyprmcp/jetski/internal/handlers/webhook/kubernetes"
	"github.com/hyprmcp/jetski/internal/handlers/webhook/tlsask"
	"github.com/hyprmcp/jetski/internal/mail"
	"github.com/hyprmcp/jetski/internal/middleware"
	"go.uber.org/zap"
)

func NewRouter(logger *zap.Logger, db queryable.Queryable, mailer mail.Mailer) http.Handler {
	r := chi.NewMux()

	r.Use(
		chimiddleware.Recoverer,
		chimiddleware.RequestID,
		middleware.Sentry,
		middleware.LoggerCtxMiddleware(logger),
		middleware.ContextInjectorMiddleware(db, mailer),
	)

	r.Post("/sync", kubernetes.NewHandler())
	r.Get("/ask", tlsask.NewHandler())

	return r
}
