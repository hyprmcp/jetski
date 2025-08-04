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
		r.Route("/members", func(r chi.Router) {
			r.Get("/", getOrganizationMembers)
			r.Put("/", putOrganizationMember())
			r.Delete("/{userId}", deleteOrganizationMember())
		})
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

func putOrganizationMember() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		orgID := getOrganizationIDAndCheckAccess(w, r)
		if orgID == uuid.Nil {
			return
		}

		var req struct {
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			Handle4XXError(w, http.StatusBadRequest)
			return
		}
		req.Email = strings.TrimSpace(req.Email)

		if u, err := db.GetUserByEmailOrCreate(ctx, req.Email); err != nil {
			HandleInternalServerError(w, r, err, "failed to add user to org")
		} else if err := db.AddUserToOrganization(ctx, u.ID, orgID); err != nil && !errors.Is(err, apierrors.ErrAlreadyExists) {
			HandleInternalServerError(w, r, err, "failed to add user to org")
		} else {
			// TODO send notification mail
			RespondJSON(w, u)
		}
	}
}

func deleteOrganizationMember() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := internalctx.GetUser(ctx)
		orgID := getOrganizationIDAndCheckAccess(w, r)
		if orgID == uuid.Nil {
			return
		}
		toBeRemovedID := getUserID(w, r)
		if toBeRemovedID == uuid.Nil {
			return
		} else if user.ID == toBeRemovedID {
			Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "You cannot remove yourself from the organization.")
			return
		}

		if err := db.RemoveUserFromOrganization(ctx, toBeRemovedID, orgID); err != nil {
			HandleInternalServerError(w, r, err, "failed to remove user from org")
		} else {
			w.WriteHeader(http.StatusAccepted)
		}
	}
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
		HandleInternalServerError(w, r, err, "failed to check if user is part of org")
		return uuid.Nil
	} else if !ok {
		Handle4XXError(w, http.StatusNotFound)
		return uuid.Nil
	} else {
		return orgID
	}
}

func getUserID(w http.ResponseWriter, r *http.Request) uuid.UUID {
	if userIDStr := r.PathValue("userId"); userIDStr == "" {
		return uuid.Nil
	} else if userID, err := uuid.Parse(userIDStr); err != nil {
		Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "invalid userId")
		return uuid.Nil
	} else {
		return userID
	}
}
