import { httpResource } from '@angular/common/http';
import { Base } from './base';
import { Signal } from '@angular/core';
import { DeploymentRevisionSummary } from './dashboard';

export interface Project extends Base {
  name: string;
  organizationId: string;
  createdBy: string;
  latestDeploymentRevisionId: string;
  latestDeploymentRevisionEventId: string | undefined;
}

export function getDeploymentsForProject(project: Signal<Project | undefined>) {
  return httpResource(
    () => {
      const p = project();
      if (p) {
        return {
          url: `/api/v1/projects/${p.id}/deployment-revisions`,
        };
      }
      return undefined;
    },
    {
      parse: (value) => value as DeploymentRevisionSummary[],
    },
  );
}
