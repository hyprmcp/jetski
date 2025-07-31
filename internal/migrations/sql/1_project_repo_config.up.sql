CREATE TABLE ProjectRepositoryConfiguration(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  project_id UUID NOT NULL UNIQUE REFERENCES Project (id),
  aws_ecr_repository_arn TEXT,
  aws_ecr_repository_uri TEXT,
  aws_iam_policy_arn TEXT,
  aws_iam_role_arn TEXT
);

CREATE INDEX fk_ProjectRepositoryConfiguration_project_id ON ProjectRepositoryConfiguration (project_id);
