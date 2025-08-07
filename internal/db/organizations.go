package db

import (
	"context"
	"errors"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jetski-sh/jetski/internal/apierrors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

const (
	organizationOutputExpr = ` o.id, o.created_at, o.name `
)

func GetOrganizationsOfUser(ctx context.Context, userID uuid.UUID) ([]types.Organization, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT`+organizationOutputExpr+`
			FROM UserAccount u
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

func CreateOrganization(ctx context.Context, name string) (*types.Organization, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		INSERT INTO Organization (name)
		VALUES (@name)
		RETURNING id, created_at, name
	`, pgx.NamedArgs{"name": name})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[types.Organization])
	if err != nil {
		if pgerr := (*pgconn.PgError)(nil); errors.As(err, &pgerr) && pgerr.Code == pgerrcode.UniqueViolation {
			return nil, apierrors.ErrAlreadyExists
		}
		return nil, err
	} else {
		return result, nil
	}
}

func GetOrganizationMembers(ctx context.Context, orgID uuid.UUID) ([]types.UserAccount, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT`+userOutExpr+`
			FROM UserAccount u
			INNER JOIN Organization_UserAccount j ON u.id = j.user_account_id
			WHERE j.organization_id = @id
			ORDER BY u.created_at
	`, pgx.NamedArgs{"id": orgID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectRows(rows, pgx.RowToStructByName[types.UserAccount])
	if err != nil {
		return nil, err
	} else {
		return result, nil
	}
}
