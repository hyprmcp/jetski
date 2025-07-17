package db

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

func CreateDeploymentRevision(ctx context.Context, projectID, createdBy uuid.UUID, port int, ociUrl string) (*types.DeploymentRevision, error) {
	db := internalctx.GetDb(ctx)
	// TODO maybe tx
	rows, err := db.Query(ctx, `
		INSERT INTO DeploymentRevision (project_id, created_by, port, oci_url)
		VALUES (@projectID, @createdBy, @port, @ociUrl)
		RETURNING id, created_at, created_by, project_id, port, oci_url
	`, pgx.NamedArgs{"projectID": projectID, "createdBy": createdBy, "port": port, "ociUrl": ociUrl})
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

func AddDeploymentRevisionEvent(ctx context.Context, deploymentRevisionID uuid.UUID, eventType types.DeploymentRevisionEventType) error {
	db := internalctx.GetDb(ctx)
	_, err := db.Exec(ctx, `
		INSERT INTO DeploymentRevisionEvent (deployment_revision_id, type)
		VALUES (@drid, @type)
	`, pgx.NamedArgs{"drid": deploymentRevisionID, "type": eventType})
	return err
}
