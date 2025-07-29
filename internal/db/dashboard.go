package db

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

func GetProjectSummaries(ctx context.Context, orgID uuid.UUID) ([]types.ProjectSummary, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
    SELECT
      `+projectOutExpr+`,
      (`+organizationOutputExpr+`),
      CASE
        WHEN dr.id IS NOT NULL
          THEN (`+deploymentRevisionOutExpr+`) -- TODO build number
      END,
      CASE
        WHEN dre.id IS NOT NULL
          THEN (`+deploymentRevisionEventOutExpr+`)
      END
    FROM Project p
    INNER JOIN Organization o ON p.organization_id = o.id
    LEFT JOIN DeploymentRevision dr ON p.latest_deployment_revision_id = dr.id
    LEFT JOIN DeploymentRevisionEvent dre ON p.latest_deployment_revision_event_id = dre.id AND dre.deployment_revision_id = dr.id
    WHERE o.id = @id
    ORDER BY o.name, p.name
	`, pgx.NamedArgs{"id": orgID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectRows(rows, pgx.RowToStructByPos[types.ProjectSummary])
	if err != nil {
		return nil, err
	} else {
		return result, nil
	}
}

func GetRecentDeploymentRevisionSummaries(ctx context.Context, orgID uuid.UUID) ([]types.DeploymentRevisionSummary, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
    SELECT
      `+deploymentRevisionOutExpr+`, -- TODO build number
      ( `+projectOutExpr+`),
      (`+userOutExpr+`),
      CASE
        WHEN dre.id IS NOT NULL
          THEN (`+deploymentRevisionEventOutExpr+`)
      END
    FROM DeploymentRevision dr
    INNER JOIN Project p ON p.id = dr.project_id
    INNER JOIN UserAccount u ON u.id = dr.created_by
    LEFT JOIN DeploymentRevisionEvent dre ON dre.id = p.latest_deployment_revision_event_id
    WHERE p.organization_id = @id
    ORDER BY dr.created_at DESC
    LIMIT 10;
	`, pgx.NamedArgs{"id": orgID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectRows(rows, pgx.RowToStructByPos[types.DeploymentRevisionSummary])
	if err != nil {
		return nil, err
	} else {
		return result, nil
	}
}

func GetUsage(ctx context.Context, orgID uuid.UUID) (types.Usage, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT
			COUNT(DISTINCT l.mcp_session_id) as session_count,
			COUNT(*) as request_count
		FROM MCPServerLog l
		INNER JOIN DeploymentRevision dr ON dr.id = l.deployment_revision_id
		INNER JOIN Project p ON p.id = dr.project_id
		WHERE p.organization_id = @id
	`, pgx.NamedArgs{"id": orgID})
	if err != nil {
		return types.Usage{}, err
	}
	result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[types.Usage])
	if err != nil {
		return types.Usage{}, err
	} else {
		return result, nil
	}
}
