package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/hyprmcp/jetski/internal/db"
)

func DashboardRouter(r chi.Router) {
	r.Get("/projects", getProjectsForDashboard)
	r.Get("/deployment-revisions", getDeploymentRevisionsForDashboard)
	r.Get("/usage", getUsageForDashboard)
}

func getProjectsForDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	org := getOrganizationIfAllowed(w, r, queryParam)
	if org == nil {
		return
	}
	if summaries, err := db.GetProjectSummaries(ctx, org.ID); err != nil {
		HandleInternalServerError(w, r, err, "failed to get project summaries for dashboard")
	} else {
		RespondJSON(w, summaries)
	}
}

func getDeploymentRevisionsForDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	org := getOrganizationIfAllowed(w, r, queryParam)
	if org == nil {
		return
	}
	if summaries, err := db.GetRecentDeploymentRevisionSummaries(ctx, org.ID); err != nil {
		HandleInternalServerError(w, r, err, "failed to deployment revision summaries for dashboard")
	} else {
		RespondJSON(w, summaries)
	}
}

func getUsageForDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	org := getOrganizationIfAllowed(w, r, queryParam)
	if org == nil {
		return
	}
	if usage, err := db.GetUsage(ctx, org.ID); err != nil {
		HandleInternalServerError(w, r, err, "failed to usage for dashboard")
	} else {
		RespondJSON(w, usage)
	}
}
