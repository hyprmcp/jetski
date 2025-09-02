package kubernetes

import (
	"encoding/json"
	"net/http"
)

func NewHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
			return
		} else {
			resp.Children = desired
		}

		_ = json.NewEncoder(w).Encode(resp)
	}
}
