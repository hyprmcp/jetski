package tlsask

import (
	"net/http"
	"strings"

	"github.com/getsentry/sentry-go"
	"github.com/hyprmcp/jetski/internal/db"
	"github.com/hyprmcp/jetski/internal/env"
)

func NewHandler() http.HandlerFunc {
	getOrgName := getOrgName(env.GatewayHostFormat())

	return func(w http.ResponseWriter, r *http.Request) {
		domain := r.FormValue("domain")
		if domain == "" {
			http.Error(w, "parameter domain is required", http.StatusBadRequest)
			return
		}

		var exists bool
		var err error
		if orgName := getOrgName(domain); orgName != nil {
			exists, err = db.ExistsOrganizationWithName(r.Context(), *orgName)
		} else {
			exists, err = db.ExistsOrganizationWithCustomDomain(r.Context(), domain)
		}

		if err != nil {
			sentry.GetHubFromContext(r.Context()).CaptureException(err)
			w.WriteHeader(http.StatusInternalServerError)
		} else if !exists {
			w.WriteHeader(http.StatusNotFound)
		} else {
			w.WriteHeader(http.StatusOK)
		}
	}
}

func getOrgName(want string) func(have string) (found *string) {
	w := strings.Split(want, ".")

	return func(have string) (found *string) {
		h := strings.Split(have, ".")

		if len(w) == 0 || len(w) != len(h) {
			return nil
		}

		for i := len(w) - 1; i >= 0; i-- {
			wp := w[i]
			hp := h[i]
			if wp == "%v" || wp == "%s" {
				found = &hp
			} else if wp != hp {
				return nil
			}
		}

		return
	}
}
