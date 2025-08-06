import { httpResource } from '@angular/common/http';
import { Base } from './base';
import { Signal } from '@angular/core';
import { DeploymentRevisionSummary } from './dashboard';
import { ProjectAnalytics } from '../app/pages/project/dashboard/project-dashboard.component';

export interface Project extends Base {
  name: string;
  organizationId: string;
  createdBy: string;
  latestDeploymentRevisionId: string;
  latestDeploymentRevisionEventId: string | undefined;
}

export function getProjects() {
  return httpResource(() => '/api/v1/projects', {
    parse: (value) => value as Project[],
  });
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

export function getAnalyticsForProject(
  project: Signal<Project | undefined>,
  startedAt?: Signal<number | undefined>,
  buildNumber?: Signal<number | undefined>,
) {
  return httpResource(
    () => {
      const p = project();
      if (p) {
        const params: Record<string, string> = {};

        const startAtValue = startedAt?.();
        if (startAtValue !== undefined) {
          params['startedAt'] = startAtValue.toString();
        }

        const buildNumberValue = buildNumber?.();
        if (buildNumberValue !== undefined) {
          params['buildNumber'] = buildNumberValue.toString();
        }

        return {
          url: `/api/v1/projects/${p.id}/analytics`,
          params,
        };
      }
      return undefined;
    },
    {
      parse: (value) => value as ProjectAnalytics,
    },
  );
}
