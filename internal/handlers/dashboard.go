package handlers

import (
	"github.com/getsentry/sentry-go"
	"github.com/go-chi/chi/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"go.uber.org/zap"
	"net/http"
)

func DashboardRouter(r chi.Router) {
	r.Get("/projects", getProjectsForDashboard)
	r.Get("/deployment-revisions", getDeploymentRevisionsForDashboard)
}

func getProjectsForDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := internalctx.GetLogger(ctx)
	user := internalctx.GetUser(ctx)
	if summaries, err := db.GetProjectSummaries(ctx, user.ID); err != nil {
		log.Error("failed to get projects for user", zap.Error(err))
		sentry.GetHubFromContext(ctx).CaptureException(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	} else {
		RespondJSON(w, summaries)
	}
}

func getDeploymentRevisionsForDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := internalctx.GetLogger(ctx)
	user := internalctx.GetUser(ctx)
	if summaries, err := db.GetRecentDeploymentRevisionSummaries(ctx, user.ID); err != nil {
		log.Error("failed to deployment revisions for user", zap.Error(err))
		sentry.GetHubFromContext(ctx).CaptureException(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	} else {
		RespondJSON(w, summaries)
	}
}
