package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/getsentry/sentry-go"
	"github.com/google/uuid"
	"github.com/hyprmcp/jetski/internal/apierrors"
	"github.com/hyprmcp/jetski/internal/kubernetes/apply"
	"github.com/hyprmcp/jetski/internal/mailsending"
	"github.com/hyprmcp/jetski/internal/types"
	"go.uber.org/zap"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/go-chi/chi/v5"
	internalctx "github.com/hyprmcp/jetski/internal/context"
	"github.com/hyprmcp/jetski/internal/db"
)

func OrganizationsRouter(k8sClient client.Client) func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", getOrganizations)
		r.Post("/", postOrganizationHandler())
		r.Route("/{organizationId}", func(r chi.Router) {
			r.Put("/", putOrganizationHandler(k8sClient))
			r.Route("/members", func(r chi.Router) {
				r.Get("/", getOrganizationMembers)
				r.Put("/", putOrganizationMember())
				r.Delete("/{userId}", deleteOrganizationMember())
			})
		})
	}
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
		if ok := validateName(w, orgReq.Name); !ok {
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

func getOrganizationMembers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	org := getOrganizationIfAllowed(w, r, pathParam)
	if org == nil {
		return
	}
	users, err := db.GetOrganizationMembers(ctx, org.ID)
	if err != nil {
		HandleInternalServerError(w, r, err, "could not get users of org")
		return
	}

	RespondJSON(w, users)
}

func putOrganizationHandler(k8sClient client.Client) http.HandlerFunc {
	gatewayApplier := apply.MCPGateway(k8sClient)

	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		log := internalctx.GetLogger(ctx)

		org := getOrganizationIfAllowed(w, r, pathParam)
		if org == nil {
			return
		}

		var request struct {
			Settings struct {
				Authorization *types.OrganizationAuthorizationSettings
			}
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			Handle4XXError(w, http.StatusBadRequest)
			return
		}

		updateNeeded := false

		if request.Settings.Authorization != nil {
			updateNeeded = true
			org.Settings.Authorization = *request.Settings.Authorization
		}

		if updateNeeded {
			if err := db.UpdateOrganization(ctx, org); err != nil {
				HandleInternalServerError(w, r, err, "error updating organization")
				return
			}
		}

		if err := gatewayApplier.Apply(ctx, *org); err != nil {
			log.Error("failed to create MCPGateway resource", zap.Error(err))
		}

		RespondJSON(w, org)
	}
}

func putOrganizationMember() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		log := internalctx.GetLogger(ctx)
		org := getOrganizationIfAllowed(w, r, pathParam)
		if org == nil {
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
		var user *types.UserAccount
		err := db.RunTx(ctx, func(ctx context.Context) error {
			var err error
			if user, err = db.GetUserByEmailOrCreate(ctx, req.Email); err != nil {
				return err
			} else if err = db.AddUserToOrganization(ctx, user.ID, org.ID); err != nil && !errors.Is(err, apierrors.ErrAlreadyExists) {
				return err
			} else {
				return nil
			}
		})
		if err != nil {
			HandleInternalServerError(w, r, err, "failed to add user to org")
		} else {
			if err := mailsending.SendUserInviteMail(ctx, *user, *org); err != nil {
				log.Error("failed to send invite mail", zap.Error(err))
				sentry.GetHubFromContext(ctx).CaptureException(err)
			}
			RespondJSON(w, user)
		}
	}
}

func deleteOrganizationMember() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := internalctx.GetUser(ctx)
		org := getOrganizationIfAllowed(w, r, pathParam)
		if org == nil {
			return
		}
		toBeRemovedID := getUserID(w, r)
		if toBeRemovedID == uuid.Nil {
			return
		} else if user.ID == toBeRemovedID {
			Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "You cannot remove yourself from the organization.")
			return
		}

		if err := db.RemoveUserFromOrganization(ctx, toBeRemovedID, org.ID); err != nil {
			HandleInternalServerError(w, r, err, "failed to remove user from org")
		} else {
			w.WriteHeader(http.StatusAccepted)
		}
	}
}

func getOrganizationIfAllowed(w http.ResponseWriter, r *http.Request, getter paramGetter) *types.Organization {
	ctx := r.Context()
	user := internalctx.GetUser(ctx)
	if orgIDStr := getter(r, "organizationId"); orgIDStr == "" {
		return nil
	} else if orgID, err := uuid.Parse(orgIDStr); err != nil {
		Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "invalid organizationId")
		return nil
	} else if ok, org, err := db.IsUserPartOfOrg(ctx, user.ID, orgID); err != nil {
		HandleInternalServerError(w, r, err, "failed to check if user is part of org")
		return nil
	} else if !ok {
		Handle4XXError(w, http.StatusNotFound)
		return nil
	} else {
		return org
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
