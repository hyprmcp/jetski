package db

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jetski-sh/jetski/internal/apierrors"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

func CreateUser(ctx context.Context, email string) (*types.UserAccount, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		INSERT INTO UserAccount (email)
		VALUES (@email)
		RETURNING id, created_at, email
	`, pgx.NamedArgs{"email": email})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[types.UserAccount])
	if err != nil {
		if pgerr := (*pgconn.PgError)(nil); errors.As(err, &pgerr) && pgerr.Code == pgerrcode.UniqueViolation {
			return nil, apierrors.ErrAlreadyExists
		}
		return nil, err
	} else {
		return result, nil
	}
}

func AddUserToOrganization(ctx context.Context, userID, orgID uuid.UUID) error {
	db := internalctx.GetDb(ctx)
	_, err := db.Exec(ctx, `
		INSERT INTO Organization_UserAccount (organization_id, user_account_id)
		VALUES (@orgID, @userID)
	`, pgx.NamedArgs{"orgID": orgID, "userID": userID})
	return err
}
