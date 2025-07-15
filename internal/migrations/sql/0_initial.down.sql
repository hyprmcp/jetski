DROP INDEX IF EXISTS fk_MCPServerLog_user_id;
DROP INDEX IF EXISTS fk_MCPServerLog_organization_id;
DROP INDEX IF EXISTS fk_MCPServerLog_deployment_revision_id;
DROP TABLE IF EXISTS MCPServerLog;

DROP INDEX IF EXISTS fk_DeploymentRevisionEvent_deployment_revision_id;
DROP TABLE IF EXISTS DeploymentRevisionEvent;

DROP TYPE IF EXISTS DEPLOYMENT_REVISION_EVENT_TYPE;
DROP INDEX IF EXISTS fk_DeploymentRevision_project_id;
DROP TABLE IF EXISTS DeploymentRevision;

DROP INDEX IF EXISTS fk_Project_organization_id;
DROP TABLE IF EXISTS Project;

DROP INDEX IF EXISTS fk_Organization_UserAccount_user_id;
DROP INDEX IF EXISTS fk_Organization_UserAccount_organization_id;
DROP TABLE IF EXISTS Organization_UserAccount;

DROP TABLE IF EXISTS UserAccount;

DROP TABLE IF EXISTS Organization;
