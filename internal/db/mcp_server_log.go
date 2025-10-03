package db

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/hyprmcp/jetski/internal/lists"

	"github.com/google/uuid"
	"github.com/hyprmcp/jetski/internal/apierrors"
	internalctx "github.com/hyprmcp/jetski/internal/context"
	"github.com/hyprmcp/jetski/internal/types"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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
			"startedAt":            data.StartedAt.UTC(),
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

func GetLogsForProject(
	ctx context.Context,
	projectId uuid.UUID,
	pagination lists.Pagination,
	sorting lists.Sorting,
	id *uuid.UUID,
	mcpSessionID *string,
) ([]types.MCPServerLog, error) {
	db := internalctx.GetDb(ctx)
	offset := pagination.Count * pagination.Page
	filters := []string{"deployment_revision_id IN (SELECT id FROM DeploymentRevision WHERE project_id = @projectId)"}
	if id != nil {
		filters = append(filters, "id = @id")
	}
	if mcpSessionID != nil {
		filters = append(filters, "mcp_session_id = @mcpSessionId")
	}
	query := fmt.Sprintf(`
		SELECT * FROM MCPServerLog
		WHERE %s
		ORDER BY %s %s
		LIMIT @count OFFSET @offset
	`, strings.Join(filters, " AND "), sorting.SortBy, sorting.SortOrder)
	rows, err := db.Query(ctx, query, pgx.NamedArgs{"projectId": projectId, "count": pagination.Count, "offset": offset, "id": id, "mcpSessionId": mcpSessionID})
	if err != nil {
		return nil, err
	}
	logs, err := pgx.CollectRows(rows, pgx.RowToStructByName[types.MCPServerLog])
	if err != nil {
		return nil, err
	}
	return logs, nil
}

func GetPromptsForProject(
	ctx context.Context,
	projectId uuid.UUID,
	pagination lists.Pagination,
	sorting lists.Sorting,
	mcpSessionID *string,
) ([]types.MCPServerLogPromptData, error) {
	db := internalctx.GetDb(ctx)
	offset := pagination.Count * pagination.Page
	filters := []string{"deployment_revision_id IN (SELECT id FROM DeploymentRevision WHERE project_id = @projectId)"}
	if mcpSessionID != nil {
		filters = append(filters, "mcp_session_id = @mcpSessionId")
	}
	query := fmt.Sprintf(
		`SELECT * FROM (
			SELECT
				id,
				started_at,
				jsonb_path_query_first(mcp_request, '$.method') #>> '{}' AS method,
				jsonb_path_query_first(mcp_request, '$.params.name') #>> '{}' AS tool_name,
				jsonb_path_query_first(mcp_request, '$.params.arguments.hyprmcpPromptAnalytics') #>> '{}' AS prompt
			FROM MCPServerLog
			WHERE %s
		)
		WHERE prompt IS NOT NULL
		ORDER BY %s %s
		LIMIT @count OFFSET @offset`,
		strings.Join(filters, " AND "),
		sorting.SortBy,
		sorting.SortOrder,
	)
	rows, err := db.Query(ctx, query, pgx.NamedArgs{"projectId": projectId, "count": pagination.Count, "offset": offset, "mcpSessionId": mcpSessionID})
	if err != nil {
		return nil, err
	}
	logs, err := pgx.CollectRows(rows, pgx.RowToStructByPos[types.MCPServerLogPromptData])
	if err != nil {
		return nil, err
	}
	return logs, nil
}
