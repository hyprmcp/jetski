package db

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

func GetProjectsForUser(ctx context.Context, userID uuid.UUID) ([]types.ProjectOverview, error) {
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
    INNER JOIN Organization_UserAccount j ON o.id = j.organization_id
    LEFT JOIN DeploymentRevision dr ON p.latest_deployment_revision_id = dr.id
    LEFT JOIN DeploymentRevisionEvent dre ON p.latest_deployment_revision_event_id = dre.id AND dre.deployment_revision_id = dr.id
    WHERE j.user_account_id = @id
    ORDER BY o.name, p.name
	`, pgx.NamedArgs{"id": userID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectRows(rows, pgx.RowToStructByPos[types.ProjectOverview])
	if err != nil {
		return nil, err
	} else {
		return result, nil
	}
}

func CreateProject(ctx context.Context, orgID, createdBy uuid.UUID, name string) (*types.Project, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		INSERT INTO Project (created_by, organization_id, name)
		VALUES (@createdBy, @orgID, @name)
		RETURNING id, created_at, created_by, organization_id, name, latest_deployment_revision_id, latest_deployment_revision_event_id
	`, pgx.NamedArgs{"orgID": orgID, "createdBy": createdBy, "name": name})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[types.Project])
	if err != nil {
		return nil, err
	} else {
		return result, nil
	}
}
