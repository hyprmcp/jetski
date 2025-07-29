package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
)

func OrganizationsRouter(r chi.Router) {
	r.Get("/", getOrganizations)
}

func getOrganizations(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user := internalctx.GetUser(ctx)

	orgs, err := db.GetOrganizationsOfUser(ctx, user.ID)
	if err != nil {
		HandleInternalServerError(w, r, err, "could not get orgs for user")
		return
	}

	RespondJSON(w, orgs)
}
