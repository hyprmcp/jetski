-- Down migration to reverse ON DELETE CASCADE constraints
-- This restores the original foreign key constraints without CASCADE behavior

-- Handle self-referencing foreign keys from Project table first (temporary removal)
ALTER TABLE Project DROP CONSTRAINT IF EXISTS project_latest_deployment_revision_id_fkey;
ALTER TABLE Project DROP CONSTRAINT IF EXISTS project_latest_deployment_revision_event_id_fkey;

-- 1. DeploymentRevision.project_id -> Project.id (restore original constraint)
ALTER TABLE DeploymentRevision DROP CONSTRAINT IF EXISTS deploymentrevision_project_id_fkey;
ALTER TABLE DeploymentRevision ADD CONSTRAINT deploymentrevision_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES Project (id);

-- 2. DeploymentRevisionEvent.deployment_revision_id -> DeploymentRevision.id (restore original constraint)
ALTER TABLE DeploymentRevisionEvent DROP CONSTRAINT IF EXISTS deploymentrevisionevent_deployment_revision_id_fkey;
ALTER TABLE DeploymentRevisionEvent ADD CONSTRAINT deploymentrevisionevent_deployment_revision_id_fkey
    FOREIGN KEY (deployment_revision_id) REFERENCES DeploymentRevision (id);

-- 3. MCPServerLog.deployment_revision_id -> DeploymentRevision.id (restore original constraint)
ALTER TABLE MCPServerLog DROP CONSTRAINT IF EXISTS mcpserverlog_deployment_revision_id_fkey;
ALTER TABLE MCPServerLog ADD CONSTRAINT mcpserverlog_deployment_revision_id_fkey
    FOREIGN KEY (deployment_revision_id) REFERENCES DeploymentRevision (id);

-- 4. ContextProperty.project_id -> Project.id (restore original constraint)
ALTER TABLE ContextProperty DROP CONSTRAINT IF EXISTS contextproperty_project_id_fkey;
ALTER TABLE ContextProperty ADD CONSTRAINT contextproperty_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES Project (id);

-- 5. Context.context_property_id -> ContextProperty.id (restore original constraint)
ALTER TABLE Context DROP CONSTRAINT IF EXISTS context_context_property_id_fkey;
ALTER TABLE Context ADD CONSTRAINT context_context_property_id_fkey
    FOREIGN KEY (context_property_id) REFERENCES ContextProperty (id);

-- Restore self-referencing foreign keys from Project table without CASCADE behavior
ALTER TABLE Project ADD CONSTRAINT project_latest_deployment_revision_id_fkey
    FOREIGN KEY (latest_deployment_revision_id) REFERENCES DeploymentRevision (id);

ALTER TABLE Project ADD CONSTRAINT project_latest_deployment_revision_event_id_fkey
    FOREIGN KEY (latest_deployment_revision_event_id) REFERENCES DeploymentRevisionEvent (id);
