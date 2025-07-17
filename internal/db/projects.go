package db

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

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
