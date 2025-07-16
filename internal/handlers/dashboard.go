package handlers

import (
	"github.com/go-chi/chi/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"go.uber.org/zap"
	"net/http"
)

func DashboardRouter(r chi.Router) {
	r.Get("/projects", getProjectsForDashboard)
}

func getProjectsForDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := internalctx.GetLogger(ctx)
	user := internalctx.GetUser(ctx)
	if projects, err := db.GetProjectsForUser(ctx, user.ID); err != nil {
		log.Error("failed to get projects for user", zap.Error(err))
		// TODO sentry
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	} else {
		RespondJSON(w, projects)
	}
}
