package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jetski-sh/jetski/internal/apierrors"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"github.com/jetski-sh/jetski/internal/types"
	"go.uber.org/zap"
)

func WebhookRouter(r chi.Router) {
	r.Post("/proxy/{deploymentRevisionID}", newPostProxyWebhookHandler())
}

type webhookPayload struct {
	Subject         string        `json:"subject"`
	SubjectEmail    string        `json:"subjectEmail"`
	MCPSessionID    string        `json:"mcpSessionId"`
	StartedAt       time.Time     `json:"startedAt"`
	Duration        time.Duration `json:"duration"`
	AuthTokenDigest string        `json:"authTokenDigest"`
	MCPRequest      any           `json:"mcpRequest,omitempty"`
	MCPResponse     any           `json:"mcpResponse,omitempty"`
	UserAgent       string        `json:"userAgent"`
	HttpStatusCode  int           `json:"httpStatusCode,omitempty"`
	HttpError       string        `json:"httpError,omitempty"`
}

func newPostProxyWebhookHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		log := internalctx.GetLogger(ctx)

		var payload webhookPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		mcpLogEntry := types.MCPServerLog{
			MCPSessionID:    &payload.MCPSessionID,
			StartedAt:       payload.StartedAt,
			Duration:        payload.Duration,
			AuthTokenDigest: &payload.AuthTokenDigest,
			MCPRequest:      payload.MCPRequest,
			MCPResponse:     payload.MCPResponse,
			UserAgent:       &payload.UserAgent,
			HttpStatusCode:  &payload.HttpStatusCode,
			HttpError:       &payload.HttpError,
		}

		if id, err := uuid.Parse(r.PathValue("deploymentRevisionID")); err != nil {
			http.Error(w, "deploymentRevisionID must be a UUID", http.StatusBadRequest)
		} else {
			mcpLogEntry.DeploymentRevisionID = id
		}

		if user, err := db.GetUserByEmail(ctx, payload.SubjectEmail); err != nil {
			log.Warn("user not found", zap.Error(err))
		} else {
			mcpLogEntry.UserAccountID = &user.ID
		}

		if err := db.CreateMCPServerLog(ctx, &mcpLogEntry); errors.Is(err, apierrors.ErrNotFound) {
			log.Error("failed to create log entry", zap.Error(err))
			http.Error(w, "Bad request", http.StatusBadRequest)
		} else if err != nil {
			log.Error("failed to create log entry", zap.Error(err))
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}
