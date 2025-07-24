package handlers

import (
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"net/http"
)

func DashboardRouter(r chi.Router) {
	r.Get("/projects", getProjectsForDashboard)
	r.Get("/deployment-revisions", getDeploymentRevisionsForDashboard)
}

func getProjectsForDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgID := getOrgIDAndCheckAccess(w, r)
	if orgID == uuid.Nil {
		return
	}
	if summaries, err := db.GetProjectSummaries(ctx, orgID); err != nil {
		HandleInternalServerError(w, r, err, "failed to get project summaries for user")
	} else {
		RespondJSON(w, summaries)
	}
}

func getDeploymentRevisionsForDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgID := getOrgIDAndCheckAccess(w, r)
	if orgID == uuid.Nil {
		return
	}
	if summaries, err := db.GetRecentDeploymentRevisionSummaries(ctx, orgID); err != nil {
		HandleInternalServerError(w, r, err, "failed to deployment revision summaries for user")
	} else {
		RespondJSON(w, summaries)
	}
}

func getOrgIDAndCheckAccess(w http.ResponseWriter, r *http.Request) uuid.UUID {
	ctx := r.Context()
	user := internalctx.GetUser(ctx)
	if orgIDStr := r.URL.Query().Get("organizationId"); orgIDStr == "" {
		return uuid.Nil
	} else if orgID, err := uuid.Parse(orgIDStr); err != nil {
		Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "invalid organizationId")
		return uuid.Nil
	} else if ok, err := db.IsUserPartOfOrg(ctx, user.ID, orgID); err != nil {
		HandleInternalServerError(w, r, err, "failed to check if user is in org")
		return uuid.Nil
	} else if !ok {
		Handle4XXError(w, http.StatusNotFound)
		return uuid.Nil
	} else {
		return orgID
	}
}
