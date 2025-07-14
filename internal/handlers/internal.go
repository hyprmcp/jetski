package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jetski-sh/jetski/internal/env"
	"github.com/jetski-sh/jetski/internal/util"
)

func InternalRouter(r chi.Router) {
	r.Handle("/environment", getFrontendEnvironmentHandler())
}

func getFrontendEnvironmentHandler() http.HandlerFunc {
	// precompute the json response
	frontendEnvJSON := util.Require(json.Marshal(struct {
		SentryDSN             *string  `json:"sentryDsn,omitempty"`
		SentryEnvironment     string   `json:"sentryEnvironment,omitzero"`
		SentryTraceSampleRate *float64 `json:"sentryTraceSampleRate,omitempty"`
		PosthogToken          *string  `json:"posthogToken,omitempty"`
		PosthogAPIHost        *string  `json:"posthogApiHost,omitempty"`
		PosthogUIHost         *string  `json:"posthogUiHost,omitempty"`
		RegistryHost          string   `json:"registryHost"`
	}{
		SentryDSN:             env.FrontendSentryDSN(),
		SentryEnvironment:     env.SentryEnvironment(),
		SentryTraceSampleRate: env.FrontendSentryTraceSampleRate(),
		PosthogToken:          env.FrontendPosthogToken(),
		PosthogAPIHost:        env.FrontendPosthogAPIHost(),
		PosthogUIHost:         env.FrontendPosthogUIHost(),
	}))
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(frontendEnvJSON)
	}
}
