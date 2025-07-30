package handlers

import (
	"github.com/go-chi/chi/v5"
	"github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"github.com/jetski-sh/jetski/internal/types"
	"net/http"
)

func ContextRouter(r chi.Router) {
	r.Get("/", getContextHandler())
}

func getContextHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := context.GetUser(ctx)
		orgs, err := db.GetOrganizationsOfUser(ctx, user.ID)
		if err != nil {
			HandleInternalServerError(w, r, err, "failed to get orgs of user")
			return
		}
		projects, err := db.GetProjectsForUser(ctx, user.ID)
		if err != nil {
			HandleInternalServerError(w, r, err, "failed to get projects of user")
			return
		}

		resp := struct {
			User          *types.UserAccount   `json:"user"`
			Organizations []types.Organization `json:"organizations"`
			Projects      []types.Project      `json:"projects"`
		}{
			User:          user,
			Organizations: orgs,
			Projects:      projects,
		}
		RespondJSON(w, resp)
	}
}
