package handlers

import (
	"github.com/getsentry/sentry-go"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"go.uber.org/zap"
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

	count := 10
	page := 0
	if countStr := r.URL.Query().Get("count"); countStr != "" {
		if c, err := strconv.Atoi(countStr); err == nil && c >= 0 {
			count = c
		} else {
			http.Error(w, "invalid count parameter", http.StatusBadRequest)
			return
		}
	}
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p >= 0 {
			page = p
		} else {
			http.Error(w, "invalid page parameter", http.StatusBadRequest)
			return
		}
	}

	if logs, err := db.GetLogsForProject(ctx, projectId, count, page); err != nil {
		log.Error("failed to get logs for project", zap.Error(err))
		sentry.GetHubFromContext(ctx).CaptureException(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	} else {
		RespondJSON(w, logs)
	}
}
