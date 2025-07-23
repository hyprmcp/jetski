package handlers

import (
	"github.com/getsentry/sentry-go"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"github.com/jetski-sh/jetski/internal/lists"
	"go.uber.org/zap"
	"net/http"
)

func ProjectsRouter(r chi.Router) {
	r.Get("/", getProjects)
	r.Route("/{projectId}", func(r chi.Router) {
		r.Get("/logs", getLogsForProject)
	})
}

func getProjects(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := internalctx.GetLogger(ctx)
	user := internalctx.GetUser(ctx)
	if projects, err := db.GetProjectsForUser(ctx, user.ID); err != nil {
		log.Error("failed to get projects for user", zap.Error(err))
		sentry.GetHubFromContext(ctx).CaptureException(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	} else {
		RespondJSON(w, projects)
	}
}

func getLogsForProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := internalctx.GetLogger(ctx)
	projectIdStr := chi.URLParam(r, "projectId")
	projectId, err := uuid.Parse(projectIdStr)
	if err != nil {
		http.Error(w, "invalid projectId", http.StatusBadRequest)
		return
	}
	pagination, err := lists.ParsePaginationOrDefault(r, lists.Pagination{Count: 10})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sorting := lists.ParseSortingOrDefault(r, lists.SortingOptions{
		DefaultSortBy:    "started_at",
		DefaultSortOrder: lists.SortOrderDesc,
		AllowedSortBy:    []string{"started_at", "duration", "http_status_code"},
	})

	if logs, err := db.GetLogsForProject(ctx, projectId, pagination, sorting); err != nil {
		log.Error("failed to get logs for project", zap.Error(err))
		sentry.GetHubFromContext(ctx).CaptureException(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	} else {
		RespondJSON(w, logs)
	}
}
