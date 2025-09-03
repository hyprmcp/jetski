package handlers

import (
	"github.com/go-chi/chi/v5"
	"github.com/hyprmcp/jetski/internal/handlers/webhook/gateway"
)

func WebhookRouter(r chi.Router) {
	r.Post("/proxy/{deploymentRevisionID}", gateway.NewHandler())
}
