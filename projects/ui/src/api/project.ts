import { HttpClient, httpResource } from '@angular/common/http';
import { Base } from './base';
import { inject, Injectable, Signal } from '@angular/core';
import { DeploymentRevisionSummary, ProjectSummary } from './dashboard';
import { ProjectAnalytics } from '../app/pages/project/dashboard/project-dashboard.component';
import { Observable } from 'rxjs';
import { Organization } from './organization';
import { ContextService } from '../app/services/context.service';

export interface Project extends Base {
  name: string;
  organizationId: string;
  createdBy: string;
  latestDeploymentRevisionId: string;
  latestDeploymentRevisionEventId: string | undefined;
}

export interface ProjectSettingsRequest {
  proxyUrl?: string;
  authenticated: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly httpClient = inject(HttpClient);
  private readonly ctx = inject(ContextService);

  public getProjectSummary(projectId: string): Observable<ProjectSummary> {
    return this.httpClient.get<ProjectSummary>(`/api/v1/projects/${projectId}`);
  }

  public putProjectSettings(
    projectId: string,
    request: ProjectSettingsRequest,
  ): Observable<ProjectSummary> {
    return this.httpClient.put<ProjectSummary>(
      `/api/v1/projects/${projectId}/settings`,
      request,
    );
  }

  public deleteProject(projectId: string): Observable<void> {
    return this.httpClient.delete<void>(`/api/v1/projects/${projectId}`);
  }
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

export function getProjectUrl(summary: ProjectSummary): string;
export function getProjectUrl(
  organization: Organization,
  project: Project,
): string;
export function getProjectUrl(
  organizationName: string,
  projectName: string,
): string;
export function getProjectUrl(
  summaryOrOrganization: ProjectSummary | Organization | string,
  project?: Project | string,
): string {
  let orgName, projectName: string;
  if (
    typeof summaryOrOrganization === 'string' &&
    typeof project === 'string'
  ) {
    orgName = summaryOrOrganization;
    projectName = project;
  } else if (
    typeof summaryOrOrganization !== 'string' &&
    typeof project !== 'string'
  ) {
    if (isOrganization(summaryOrOrganization)) {
      orgName = summaryOrOrganization.name;
      projectName = project?.name || '-';
    } else {
      orgName = summaryOrOrganization.organization.name;
      projectName = summaryOrOrganization.name;
    }
  } else {
    throw new Error('Invalid arguments');
  }

  return `https://${orgName}.hyprmcp.cloud/${projectName}/mcp`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOrganization(value: any): value is Organization {
  return value && value.id && value.name && value.settings;
}
