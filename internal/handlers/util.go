package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getsentry/sentry-go"
	internalctx "github.com/hyprmcp/jetski/internal/context"
	"go.uber.org/zap"
)

func RespondJSON(w http.ResponseWriter, data any) {
	w.Header().Add("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func HandleInternalServerError(w http.ResponseWriter, r *http.Request, err error, logMsg string) {
	ctx := r.Context()
	log := internalctx.GetLogger(ctx)
	log.Error(logMsg, zap.Error(err))
	sentry.GetHubFromContext(ctx).CaptureException(err)
	http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
}

func Handle4XXError(w http.ResponseWriter, status int) {
	http.Error(w, http.StatusText(status), status)
}

func Handle4XXErrorWithStatusText(w http.ResponseWriter, status int, statusText string) {
	http.Error(w, statusText, status)
}

type paramGetter func(r *http.Request, param string) string

func pathParam(r *http.Request, param string) string {
	return r.PathValue(param)
}

func queryParam(r *http.Request, param string) string {
	return r.URL.Query().Get(param)
}
