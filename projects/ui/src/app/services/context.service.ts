import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { getContext } from '../../api/context';
import { Project } from '../../api/project';

@Injectable({
  providedIn: 'root',
})
export class ContextService {
  private readonly createdProjects = signal<Project[]>([]);

  readonly context = getContext(this.createdProjects);
  readonly projects = computed(() => this.context.value()?.projects ?? []);
  readonly organizations = computed(
    () => this.context.value()?.organizations ?? [],
  );

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly selectedOrgName = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => getFirstPathParam(this.route, 'organizationName')),
    ),
  );

  readonly selectedProjectName = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => getFirstPathParam(this.route, 'projectName')),
    ),
  );

  readonly selectedOrg = computed(() => {
    const orgs = this.organizations();
    const name = this.selectedOrgName();
    return orgs.find((org) => org.name === name);
  });

  readonly selectedProject = computed(() => {
    const projects = this.projects();
    const name = this.selectedProjectName();
    const org = this.selectedOrg();
    return projects.find(
      (project) => project.name === name && project.organizationId === org?.id,
    );
  });

  public registerCreatedProject(project: Project) {
    this.createdProjects.update((val) => [...val, project]);
  }
}

export function getFirstPathParam(
  route: ActivatedRoute | ActivatedRouteSnapshot | null,
  paramName: string,
): string | null {
  if (route === null) {
    return null;
  } else if (route instanceof ActivatedRoute) {
    return getFirstPathParam(route.snapshot, paramName);
  } else {
    return (
      route.paramMap.get(paramName) ??
      getFirstPathParam(route.firstChild, paramName)
    );
  }
}
