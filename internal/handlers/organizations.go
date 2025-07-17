package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"go.uber.org/zap"
)

func OrganizationsRouter(r chi.Router) {
	r.Get("/", getOrganizations)
}

func getOrganizations(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := internalctx.GetLogger(ctx)
	user := internalctx.GetUser(ctx)

	orgs, err := db.GetOrganizationsOfUser(ctx, user.ID)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Error("could not get orgs for user", zap.Error(err))
		return
	}

	RespondJSON(w, orgs)
}
