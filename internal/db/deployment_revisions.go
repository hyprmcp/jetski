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
	deploymentRevisionOutExpr      = " dr.id, dr.created_at, dr.created_by, dr.project_id, dr.port, dr.oci_url, '#11' " // TODO build number
	deploymentRevisionEventOutExpr = " dre.id, dre.created_at, dre.deployment_revision_id, dre.type "
)

func CreateDeploymentRevision(ctx context.Context, projectID, createdBy uuid.UUID, port int, ociUrl string, timestamp *time.Time) (*types.DeploymentRevision, error) {
	db := internalctx.GetDb(ctx)
	createdAt := time.Now()
	if timestamp != nil {
		createdAt = *timestamp
	}
	// TODO maybe tx
	rows, err := db.Query(ctx, `
		INSERT INTO DeploymentRevision (project_id, created_by, port, oci_url, created_at)
		VALUES (@projectID, @createdBy, @port, @ociUrl, @createdAt)
		RETURNING id, created_at, created_by, project_id, port, oci_url, '#11' as build_number -- TODO build number
	`, pgx.NamedArgs{"projectID": projectID, "createdBy": createdBy, "port": port, "ociUrl": ociUrl, "createdAt": createdAt})
	if err != nil {
		return nil, err
	}
	dr, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[types.DeploymentRevision])
	if err != nil {
		return nil, err
	}
	_, err = db.Exec(ctx, `
		UPDATE Project SET latest_deployment_revision_id = @drid WHERE id = @projectID
	`, pgx.NamedArgs{"drid": dr.ID, "projectID": projectID})
	if err != nil {
		return nil, err
	}
	return dr, nil
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
      `+deploymentRevisionOutExpr+`, -- TODO build number
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
