package handlers

import (
	"encoding/json"
	"errors"
	"github.com/google/uuid"
	"github.com/jetski-sh/jetski/internal/apierrors"
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
)

func OrganizationsRouter(r chi.Router) {
	r.Get("/", getOrganizations)
	r.Post("/", postOrganizationHandler())
	r.Route("/{organizationId}", func(r chi.Router) {
		r.Get("/members", getOrganizationMembers)
	})
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
		orgReq.Name = strings.TrimSpace(orgReq.Name)
		if ok := validateOrgName(w, orgReq.Name); !ok {
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

func validateOrgName(w http.ResponseWriter, name string) bool {
	name = strings.TrimSpace(name)
	if name == "" {
		Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "Empty name is not allowed.")
		return false
	}
	pattern := "^[a-zA-Z0-9]+(([-_])[a-zA-Z0-9]+)*$"
	if matched, _ := regexp.MatchString(pattern, name); !matched {
		Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "Name is invalid.")
		return false
	}
	return true
}

func getOrganizationMembers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgID := getOrganizationIDAndCheckAccess(w, r)
	if orgID == uuid.Nil {
		return
	}
	users, err := db.GetOrganizationMembers(ctx, orgID)
	if err != nil {
		HandleInternalServerError(w, r, err, "could not get users of org")
		return
	}

	RespondJSON(w, users)
}

func getOrganizationIDAndCheckAccess(w http.ResponseWriter, r *http.Request) uuid.UUID {
	ctx := r.Context()
	user := internalctx.GetUser(ctx)
	if orgIDStr := r.PathValue("organizationId"); orgIDStr == "" {
		return uuid.Nil
	} else if orgID, err := uuid.Parse(orgIDStr); err != nil {
		Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "invalid organizationId")
		return uuid.Nil
	} else if ok, err := db.IsUserPartOfOrg(ctx, user.ID, orgID); err != nil {
		HandleInternalServerError(w, r, err, "failed to check if user can access project")
		return uuid.Nil
	} else if !ok {
		Handle4XXError(w, http.StatusNotFound)
		return uuid.Nil
	} else {
		return orgID
	}
}
