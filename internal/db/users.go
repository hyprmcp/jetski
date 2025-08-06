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

const (
	userOutExpr = " u.id, u.created_at, u.email "
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

func GetUserByEmail(ctx context.Context, email string) (*types.UserAccount, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT `+userOutExpr+` FROM UserAccount u WHERE u.email = @email
	`, pgx.NamedArgs{"email": email})
	if err != nil {
		return nil, err
	}
	user, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[types.UserAccount])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apierrors.ErrNotFound
		}
		return nil, err
	}
	return user, nil
}
func GetUserByEmailOrCreate(ctx context.Context, email string) (*types.UserAccount, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		WITH inserted AS (
			INSERT INTO UserAccount (email)
			VALUES (@email)
			ON CONFLICT (email) DO NOTHING
			RETURNING *
		)
		SELECT `+userOutExpr+` FROM UserAccount u WHERE u.email = @email
		UNION
		SELECT `+userOutExpr+` FROM inserted u
	`, pgx.NamedArgs{"email": email})
	if err != nil {
		return nil, err
	}
	user, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[types.UserAccount])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apierrors.ErrNotFound
		}
		return nil, err
	}
	return user, nil
}

func IsUserPartOfOrg(ctx context.Context, userID, orgID uuid.UUID) (bool, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT EXISTS (
			SELECT * FROM Organization_UserAccount
			WHERE user_account_id = @userID AND organization_id = @orgID
		)`, pgx.NamedArgs{"userID": userID, "orgID": orgID})
	if err != nil {
		return false, err
	}
	res, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByPos[struct {
		Exists bool
	}])
	if err != nil {
		return false, err
	}
	return res.Exists, nil
}

func CanUserAccessProject(ctx context.Context, userID, projectID uuid.UUID) (bool, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT EXISTS (
			SELECT *
			FROM Organization_UserAccount oua
			INNER JOIN Project p ON p.organization_id = oua.organization_id
			WHERE oua.user_account_id = @userID AND p.id = @projectID
		)`, pgx.NamedArgs{"userID": userID, "projectID": projectID})
	if err != nil {
		return false, err
	}
	res, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByPos[struct {
		Exists bool
	}])
	if err != nil {
		return false, err
	}
	return res.Exists, nil
}

func GetAllUsers(ctx context.Context) ([]types.UserAccount, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT `+userOutExpr+` FROM UserAccount u `)
	if err != nil {
		return nil, err
	}
	users, err := pgx.CollectRows(rows, pgx.RowToStructByName[types.UserAccount])
	if err != nil {
		return nil, err
	}
	return users, nil
}
