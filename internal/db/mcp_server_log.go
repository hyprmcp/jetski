package db

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jetski-sh/jetski/internal/apierrors"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

func CreateMCPServerLog(ctx context.Context, data *types.MCPServerLog) error {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(
		ctx,
		`WITH inserted AS (
			INSERT INTO MCPServerLog
			(user_account_id, mcp_session_id, started_at, duration, deployment_revision_id, auth_token_digest, mcp_request,
				mcp_response, user_agent, http_status_code, http_error)
			VALUES
			(@userAccountId, @mcpSessionId, @startedAt, @duration, @deploymentRevisionId, @authTokenDigest, @mcpRequest,
				@mcpResponse, @userAgent, @httpStatusCode, @httpError)
			RETURNING *
		)
		SELECT * FROM inserted`,
		pgx.NamedArgs{
			"userAccountId":        data.UserAccountID,
			"mcpSessionId":         data.MCPSessionID,
			"startedAt":            data.StartedAt,
			"duration":             data.Duration,
			"deploymentRevisionId": data.DeploymentRevisionID,
			"authTokenDigest":      data.AuthTokenDigest,
			"mcpRequest":           data.MCPRequest,
			"mcpResponse":          data.MCPResponse,
			"userAgent":            data.UserAgent,
			"httpStatusCode":       data.HttpStatusCode,
			"httpError":            data.HttpError,
		},
	)

	if err != nil {
		return fmt.Errorf("db error on querying MCPServerLog: %w", err)
	}

	result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[types.MCPServerLog])
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) &&
			pgerrcode.IsIntegrityConstraintViolation(pgErr.Code) &&
			pgErr.ConstraintName == "mcpserverlog_deployment_revision_id_fkey" {
			return fmt.Errorf("%w: bad deployment revision ID", apierrors.ErrNotFound)
		}
		return fmt.Errorf("query MCPServerLog failed: %w", err)
	}

	*data = result
	return nil
}

func GetLogsForProject(ctx context.Context, projectId uuid.UUID) ([]types.MCPServerLog, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT * FROM MCPServerLog
		WHERE deployment_revision_id IN (
			SELECT id FROM DeploymentRevision WHERE project_id = @projectId
		)
		ORDER BY started_at DESC
		LIMIT 100
	`, pgx.NamedArgs{"projectId": projectId})
	if err != nil {
		return nil, err
	}
	logs, err := pgx.CollectRows(rows, pgx.RowToStructByName[types.MCPServerLog])
	if err != nil {
		return nil, err
	}
	return logs, nil
}
