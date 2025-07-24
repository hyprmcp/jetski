import { httpResource } from '@angular/common/http';
import { Base } from './base';
import {
  DeploymentRevision,
  DeploymentRevisionEvent,
} from './deployment-revision';
import { Organization } from './organization';
import { Project } from './project';
import { UserAccount } from './user-account';
import { Signal } from '@angular/core';

export interface ProjectSummary extends Base {
  createdBy: string;
  name: string;
  latestDeploymentRevision: DeploymentRevision | undefined;
  latestDeploymentRevisionEvent: DeploymentRevisionEvent | undefined;
  organization: Organization;
}

export function getProjectSummaries(org: Signal<Organization | undefined>) {
  return httpResource(
    () => {
      const organization = org();
      if (organization) {
        return {
          url: '/api/v1/dashboard/projects',
          params: {
            organizationId: organization.id,
          },
        };
      }
      return undefined;
    },
    {
      parse: (value) => value as ProjectSummary[],
    },
  );
}

interface DeploymentRevisionSummary extends DeploymentRevision {
  project: Project;
  author: UserAccount;
  projectLatestDeploymentRevisionEvent: DeploymentRevisionEvent | undefined;
}

export function getRecentDeployments(org: Signal<Organization | undefined>) {
  return httpResource(
    () => {
      const organization = org();
      if (organization) {
        return {
          url: `/api/v1/dashboard/deployment-revisions`,
          params: {
            organizationId: organization.id,
          },
        };
      }
      return undefined;
    },
    {
      parse: (value) => value as DeploymentRevisionSummary[],
    },
  );
}
