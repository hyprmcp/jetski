package handlers

import (
	"encoding/json"
	"errors"
	"github.com/jetski-sh/jetski/internal/apierrors"
	"net/http"

	"github.com/go-chi/chi/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
)

func OrganizationsRouter(r chi.Router) {
	r.Get("/", getOrganizations)
	r.Post("/", postOrganizationHandler())
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

func postOrganizationHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := internalctx.GetUser(ctx)

		var orgReq struct {
			Name string `json:"name"`
		}

		if err := json.NewDecoder(r.Body).Decode(&orgReq); err != nil {
			Handle4XXError(w, http.StatusBadRequest)
			return
		}

		if org, err := db.CreateOrganization(ctx, orgReq.Name); errors.Is(err, apierrors.ErrAlreadyExists) {
			Handle4XXErrorWithStatusText(w, http.StatusBadRequest,
				"An organization with this name already exists. Please choose another name.")
		} else if err != nil {
			HandleInternalServerError(w, r, err, "create organization error")
		} else if err := db.AddUserToOrganization(ctx, user.ID, org.ID); err != nil {
			HandleInternalServerError(w, r, err, "create organization error")
		} else {
			RespondJSON(w, org)
		}
	}
}
