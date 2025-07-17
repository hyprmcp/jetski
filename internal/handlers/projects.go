package handlers

import (
	"github.com/go-chi/chi/v5"
	"net/http"
)

func ProjectsRouter(r chi.Router) {
	r.Get("/", getProjects)
}

func getProjects(w http.ResponseWriter, r *http.Request) {
	// ctx := r.Context()
	// db.GetProjects(ctx)
}
