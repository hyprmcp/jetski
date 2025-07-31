package db

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/types"
)

const (
	projectOutExpr                        = " p.id, p.created_at, p.created_by, p.organization_id, p.name, p.latest_deployment_revision_id, p.latest_deployment_revision_event_id "
	projectRepositoryConfigurationOutExpr = " c.id, c.created_at, c.project_id, c.aws_ecr_repository_arn, c.aws_ecr_repository_uri, c.aws_iam_policy_arn, c.aws_iam_role_arn "
)

func GetProjectsForUser(ctx context.Context, userID uuid.UUID) ([]types.Project, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT `+projectOutExpr+`
		FROM Project p
		INNER JOIN Organization o ON p.organization_id = o.id
		INNER JOIN Organization_UserAccount j ON o.id = j.organization_id
		WHERE j.user_account_id = @id
		ORDER BY o.name, p.name
	`, pgx.NamedArgs{"id": userID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectRows(rows, pgx.RowToStructByName[types.Project])
	if err != nil {
		return nil, err
	} else {
		return result, nil
	}
}

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

func GetProjectRepositoryConfiguration(
	ctx context.Context,
	projectID uuid.UUID,
) (*types.ProjectRepositoryConfiguration, error) {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(ctx, `
		SELECT `+projectRepositoryConfigurationOutExpr+`
		FROM ProjectRepositoryConfiguration c
		WHERE c.project_id = @projectId
	`, pgx.NamedArgs{"projectId": projectID})
	if err != nil {
		return nil, err
	}
	result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[types.ProjectRepositoryConfiguration])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &types.ProjectRepositoryConfiguration{ProjectID: projectID}, nil
		}
		return nil, err
	} else {
		return &result, nil
	}
}

func SaveProjectRepositoryConfiguration(ctx context.Context, cfg *types.ProjectRepositoryConfiguration) error {
	db := internalctx.GetDb(ctx)
	rows, err := db.Query(
		ctx,
		`WITH inserted AS (
			INSERT INTO ProjectRepositoryConfiguration (
				project_id, aws_ecr_repository_arn, aws_ecr_repository_uri, aws_iam_policy_arn, aws_iam_role_arn
			) VALUES (
				@projectId, @repositoryArn, @repositoryUri, @policyArn, @roleArn
			)
			ON CONFLICT (project_id) DO UPDATE SET
				aws_ecr_repository_arn = EXCLUDED.aws_ecr_repository_arn,
				aws_ecr_repository_uri = EXCLUDED.aws_ecr_repository_uri,
				aws_iam_policy_arn = EXCLUDED.aws_iam_policy_arn,
				aws_iam_role_arn = EXCLUDED.aws_iam_role_arn
			RETURNING *
		)
		SELECT `+projectRepositoryConfigurationOutExpr+`FROM inserted c`,
		pgx.NamedArgs{
			"projectId":     cfg.ProjectID,
			"repositoryArn": cfg.AWSECRRepostoryARN,
			"repositoryUri": cfg.AWSECRRepostoryURI,
			"policyArn":     cfg.AWSIAMPolicyARN,
			"roleArn":       cfg.AWSIAMRoleARN,
		},
	)
	if err != nil {
		return err
	}
	result, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[types.ProjectRepositoryConfiguration])
	if err != nil {
		return err
	} else {
		*cfg = result
		return nil
	}
}
