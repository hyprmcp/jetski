package db

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

func GetProjectsForUser(ctx context.Context, userID uuid.UUID) ([]types.Project, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT p.id, p.created_at, p.created_by, p.organization_id, p.name, p.latest_deployment_revision_id
		FROM Project p
		INNER JOIN Organization o ON p.organization_id = o.id
		INNER JOIN Organization_UserAccount j ON o.id = j.organization_id
		WHERE j.user_account_id = @id
		ORDER BY o.name, p.name
	`, pgx.NamedArgs{"id": userID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectRows(rows, pgx.RowToStructByName[types.Project])
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
		RETURNING id, created_at, created_by, organization_id, name, latest_deployment_revision_id
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
