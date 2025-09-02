package db

import (
	"context"
	"errors"
	"fmt"

	"github.com/hyprmcp/jetski/internal/apierrors"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/google/uuid"
	internalctx "github.com/hyprmcp/jetski/internal/context"
	"github.com/hyprmcp/jetski/internal/types"
	"github.com/jackc/pgx/v5"
)

const (
	organizationOutputExpr = `
		o.id,
		o.created_at,
		o.name,
		ROW(
			o.settings_custom_domain,
			ROW(
				o.settings_authorization_dcr_public_client
			)
		) `
)

func GetOrganizationsOfUser(ctx context.Context, userID uuid.UUID) ([]types.Organization, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT`+organizationOutputExpr+`
			FROM UserAccount u
			INNER JOIN Organization_UserAccount j ON u.id = j.user_account_id
			INNER JOIN Organization o ON o.id = j.organization_id
			WHERE u.id = @id
			ORDER BY o.name
	`, pgx.NamedArgs{"id": userID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectRows(rows, pgx.RowToStructByPos[types.Organization])
	if err != nil {
		return nil, err
	} else {
		return result, nil
	}
}

func CreateOrganization(ctx context.Context, name string) (*types.Organization, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(
		ctx,
		"INSERT INTO Organization AS o (name) VALUES (@name) RETURNING "+organizationOutputExpr,
		pgx.NamedArgs{"name": name},
	)
	if err != nil {
		return nil, err
	}

	if result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByPos[types.Organization]); err != nil {
		if pgerr := (*pgconn.PgError)(nil); errors.As(err, &pgerr) && pgerr.Code == pgerrcode.UniqueViolation {
			return nil, apierrors.ErrAlreadyExists
		}
		return nil, err
	} else {
		return &result, nil
	}
}

func UpdateOrganization(ctx context.Context, org *types.Organization) error {
	db := internalctx.GetDb(ctx)

	rows, err := db.Query(
		ctx,
		`UPDATE Organization AS o
			SET settings_custom_domain = @settings_custom_domain,
				settings_authorization_dcr_public_client = @settings_authorization_dcr_public_client
		WHERE id = @id
		RETURNING `+organizationOutputExpr,
		pgx.NamedArgs{
			"id":                     org.ID,
			"settings_custom_domain": org.Settings.CustomDomain,
			"settings_authorization_dcr_public_client": org.Settings.Authorization.DCRPublicClient,
		},
	)
	if err != nil {
		return fmt.Errorf("failed to query Organization: %w", err)
	}

	if result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByPos[types.Organization]); err != nil {
		if err == pgx.ErrNoRows {
			err = apierrors.ErrNotFound
		}

		return fmt.Errorf("failed to scan Organization: %w", err)
	} else {
		*org = result
		return nil
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

func ExistsOrganizationWithName(ctx context.Context, name string) (bool, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, "SELECT true FROM Organization WHERE name = @name", pgx.NamedArgs{"name": name})
	if err != nil {
		return false, err
	}

	exists, err := pgx.CollectExactlyOneRow(rows, pgx.RowTo[bool])
	if errors.Is(err, pgx.ErrNoRows) {
		err = nil
	}

	return exists, err
}

func ExistsOrganizationWithCustomDomain(ctx context.Context, domain string) (bool, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(
		ctx,
		"SELECT true FROM Organization WHERE settings_custom_domain = @settings_custom_domain",
		pgx.NamedArgs{"settings_custom_domain": domain},
	)
	if err != nil {
		return false, err
	}

	exists, err := pgx.CollectExactlyOneRow(rows, pgx.RowTo[bool])
	if errors.Is(err, pgx.ErrNoRows) {
		err = nil
	}

	return exists, err
}
