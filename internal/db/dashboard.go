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
      p.id, p.created_at, p.created_by, p.organization_id, p.name, p.latest_deployment_revision_id, p.latest_deployment_revision_event_id,
      (o.id, o.created_at, o.name),
      CASE
        WHEN dr.id IS NOT NULL
          THEN (dr.id, dr.created_at, dr.created_by, dr.project_id, dr.port, dr.oci_url, '#11') -- TODO build number
      END,
      CASE
        WHEN dre.id IS NOT NULL
          THEN (dre.id, dre.created_at, dre.deployment_revision_id, dre.type)
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
      dr.id, dr.created_at, dr.created_by, dr.project_id, dr.port, dr.oci_url, '#11', -- TODO build number
      (p.id, p.created_at, p.created_by, p.organization_id, p.name, p.latest_deployment_revision_id, p.latest_deployment_revision_event_id),
      (author.id, author.created_at, author.email),
      CASE
        WHEN dre.id IS NOT NULL
          THEN (dre.id, dre.created_at, dre.deployment_revision_id, dre.type)
      END
    FROM DeploymentRevision dr
    INNER JOIN Project p ON p.id = dr.project_id
    INNER JOIN UserAccount author ON author.id = dr.created_by
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
