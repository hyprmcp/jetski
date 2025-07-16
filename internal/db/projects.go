package db

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

const (
	projectOutputExpr = ` o.id, o.created_at, o.name `
)

func GetProjectsForUser(ctx context.Context, userID uuid.UUID) ([]types.Organization, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT`+projectOutputExpr+`
			FROM Project p
			INNER JOIN Organization_UserAccount j ON u.id = j.user_account_id
			INNER JOIN Organization o ON o.id = j.organization_id
			WHERE u.id = @id
			ORDER BY o.created_at
	`, pgx.NamedArgs{"id": userID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectRows(rows, pgx.RowToStructByName[types.Organization])
	if err != nil {
		return nil, err
	} else {
		return result, nil
	}
}
