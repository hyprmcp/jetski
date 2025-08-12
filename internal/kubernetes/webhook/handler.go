package webhook

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func NewHandler() http.Handler {
	r := chi.NewMux()

	r.Post("/sync", func(w http.ResponseWriter, r *http.Request) {
		var req request

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		resp := response{
			Status: req.GetStatus(),
		}

		if desired, err := req.GetDesiredChildren(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			resp.Children = desired
		}

		_ = json.NewEncoder(w).Encode(resp)
	})

	return r
}
