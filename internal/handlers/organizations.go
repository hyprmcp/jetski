package handlers

import (
	"github.com/go-chi/chi/v5"
	"net/http"
)

func OrganizationsRouter(r chi.Router) {
	r.Get("/", getOrganizations)
}

func getOrganizations(w http.ResponseWriter, r *http.Request) {
	/*ctx := r.Context()
	  user := internalctx.GetUserAuthInfo(ctx)
		db.GetOrganizationsOfUser(ctx, )*/
}
