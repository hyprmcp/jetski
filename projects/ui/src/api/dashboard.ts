import { httpResource } from '@angular/common/http';
import { Base } from './base';
import {
  DeploymentRevision,
  DeploymentRevisionEvent,
} from './deployment-revision';
import { Organization } from './organization';
import { Project } from './project';
import { UserAccount } from './user-account';

export interface ProjectSummary extends Base {
  createdBy: string;
  name: string;
  latestDeploymentRevision: DeploymentRevision | undefined;
  latestDeploymentRevisionEvent: DeploymentRevisionEvent | undefined;
  organization: Organization;
}

export function getProjectSummaries() {
  return httpResource(() => '/api/v1/dashboard/projects', {
    parse: (value) => value as ProjectSummary[],
  });
}

interface DeploymentRevisionSummary extends DeploymentRevision {
  project: Project;
  author: UserAccount;
  projectLatestDeploymentRevisionEvent: DeploymentRevisionEvent | undefined;
}

export function getRecentDeployments() {
  return httpResource(() => `/api/v1/dashboard/deployment-revisions`, {
    parse: (value) => value as DeploymentRevisionSummary[],
  });
}
