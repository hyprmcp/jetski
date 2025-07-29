import { inject, Injectable, Signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatestWith, filter, map } from 'rxjs';
import { getProjects, Project } from '../../api/project';
import { getOrganizations, Organization } from '../../api/organization';

@Injectable({
  providedIn: 'root',
})
export class ContextService {
  readonly projects = getProjects();
  readonly organizations = getOrganizations();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly selectedOrg: Signal<Organization | undefined> = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.getFirstPathParam(this.route, 'organizationName')),
      combineLatestWith(toObservable(this.organizations.value)),
      map(([organizationName, orgs]) =>
        orgs?.find((org: Organization) => org.name === organizationName),
      ),
    ),
  );

  readonly selectedProject: Signal<Project | undefined> = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.getFirstPathParam(this.route, 'projectName')),
      combineLatestWith(
        toObservable(this.selectedOrg),
        toObservable(this.projects.value),
      ),
      map(([projectName, org, projects]) =>
        projects?.find(
          (project: Project) =>
            project.name === projectName && project.organizationId === org?.id,
        ),
      ),
    ),
  );

  private getFirstPathParam(
    route: ActivatedRoute,
    paramName: string,
  ): string | null {
    const paramValue = route.snapshot.paramMap.get(paramName);
    if (paramValue !== null) {
      return paramValue;
    }
    if (route.firstChild !== null) {
      return this.getFirstPathParam(route.firstChild, paramName);
    } else {
      return null;
    }
  }
}
