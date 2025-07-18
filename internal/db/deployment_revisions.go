package db

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
	"time"
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
