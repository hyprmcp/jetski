package db

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
	"time"
)

const (
	deploymentRevisionWithoutBuildNrOutExpr = " dr.id, dr.created_at, dr.created_by, dr.project_id, dr.port, dr.oci_url, dr.authenticated, dr.proxy_url "
	deploymentRevisionEventOutExpr          = " dre.id, dre.created_at, dre.deployment_revision_id, dre.type "
)

func CreateHostedDeploymentRevision(ctx context.Context, projectID, createdBy uuid.UUID, port int, ociUrl string, authenticated bool, timestamp *time.Time) (*types.DeploymentRevision, error) {
	db := internalctx.GetDb(ctx)
	createdAt := time.Now()
	if timestamp != nil {
		createdAt = *timestamp
	}
	var res *types.DeploymentRevision
	err := RunTx(ctx, func(ctx context.Context) error {
		rows, err := db.Query(ctx, `
			INSERT INTO DeploymentRevision as dr (project_id, created_by, port, oci_url, authenticated, created_at)
			VALUES (@projectID, @createdBy, @port, @ociUrl, @authenticated, @createdAt)
			RETURNING `+deploymentRevisionWithoutBuildNrOutExpr,
			pgx.NamedArgs{"projectID": projectID, "createdBy": createdBy, "port": port, "ociUrl": ociUrl, "createdAt": createdAt, "authenticated": authenticated})
		if err != nil {
			return err
		}
		dr, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByNameLax[types.DeploymentRevision])
		if err != nil {
			return err
		}
		_, err = db.Exec(ctx, "UPDATE Project SET latest_deployment_revision_id = @drid WHERE id = @projectID",
			pgx.NamedArgs{"drid": dr.ID, "projectID": projectID})
		if err != nil {
			return err
		}
		res = dr
		return nil
	})
	return res, err
}

func CreateProxiedDeploymentRevision(ctx context.Context, projectID, createdBy uuid.UUID, proxyUrl string, authenticated bool, timestamp *time.Time) (*types.DeploymentRevision, error) {
	db := internalctx.GetDb(ctx)
	createdAt := time.Now()
	if timestamp != nil {
		createdAt = *timestamp
	}
	var res *types.DeploymentRevision
	err := RunTx(ctx, func(ctx context.Context) error {
		rows, err := db.Query(ctx, `
			INSERT INTO DeploymentRevision as dr (project_id, created_by, proxy_url, authenticated, created_at)
			VALUES (@projectID, @createdBy, @proxyUrl, @authenticated, @createdAt)
			RETURNING `+deploymentRevisionWithoutBuildNrOutExpr,
			pgx.NamedArgs{"projectID": projectID, "createdBy": createdBy, "proxyUrl": proxyUrl, "createdAt": createdAt, "authenticated": authenticated})
		if err != nil {
			return err
		}
		dr, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByNameLax[types.DeploymentRevision])
		if err != nil {
			return err
		}
		_, err = db.Exec(ctx, "UPDATE Project SET latest_deployment_revision_id = @drid WHERE id = @projectID",
			pgx.NamedArgs{"drid": dr.ID, "projectID": projectID})
		if err != nil {
			return err
		}
		res = dr
		return nil
	})
	return res, err
}

func AddDeploymentRevisionEvent(ctx context.Context, deploymentRevisionID uuid.UUID, eventType types.DeploymentRevisionEventType, timestamp *time.Time) error {
	db := internalctx.GetDb(ctx)
	createdAt := time.Now()
	if timestamp != nil {
		createdAt = *timestamp
	}
	var eventID uuid.UUID
	err := db.QueryRow(ctx, `
		INSERT INTO DeploymentRevisionEvent (deployment_revision_id, type, created_at)
		VALUES (@drid, @type, @createdAt)
		RETURNING id
	`, pgx.NamedArgs{"drid": deploymentRevisionID, "type": eventType, "createdAt": createdAt}).Scan(&eventID)
	if err != nil {
		return err
	}
	_, err = db.Exec(ctx, `
		UPDATE Project SET latest_deployment_revision_event_id = @eventID
		WHERE id = (
			SELECT project_id FROM DeploymentRevision WHERE id = @drid
		)
	`, pgx.NamedArgs{"eventID": eventID, "drid": deploymentRevisionID})
	return err
}

func GetDeploymentRevisionsForProject(ctx context.Context, projectID uuid.UUID) ([]types.DeploymentRevisionSummary, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
    SELECT
      `+deploymentRevisionWithoutBuildNrOutExpr+`, row_number() OVER (PARTITION BY dr.project_id ORDER BY dr.created_at),
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
    WHERE p.id = @id
    ORDER BY dr.created_at DESC;
	`, pgx.NamedArgs{"id": projectID})
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
