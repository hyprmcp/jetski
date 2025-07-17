package handlers

import (
	"encoding/json"
	"net/http"
)

func RespondJSON(w http.ResponseWriter, data any) {
	w.Header().Add("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
	}
}
