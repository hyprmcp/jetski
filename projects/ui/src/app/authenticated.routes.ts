import { CanActivateFn, Router, Routes } from '@angular/router';
import { OrganizationDashboardComponent } from './pages/organization-dashboard/organization-dashboard.component';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { ProjectDashboardComponent } from './pages/project/dashboard/project-dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import {
  inject,
  Injector,
  ResourceStatus,
  runInInjectionContext,
  Signal,
} from '@angular/core';
import { ContextService } from './services/context.service';
import { LogsComponent } from './pages/project/logs/logs.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AppShellComponent } from './app-shell.component';
import { DeploymentsComponent } from './pages/project/deployments/deployments.component';

const redirectToDefaultPage: CanActivateFn = async () => {
  const contextService = inject(ContextService);
  const router = inject(Router);
  const orgRes = contextService.organizations;
  const injector = inject(Injector);
  await runInInjectionContext(injector, () => resourceDone(orgRes.status));
  const orgName =
    contextService.selectedOrg()?.name ??
    (orgRes.hasValue() ? orgRes.value()?.at(0)?.name : undefined);
  if (orgName) {
    const urlParts = ['/', orgName];
    if (orgRes.hasValue() && orgRes.value()?.length === 1) {
      const projectRes = contextService.projects;
      await runInInjectionContext(injector, () =>
        resourceDone(projectRes.status),
      );
      if (projectRes.hasValue() && projectRes.value()?.length === 1) {
        urlParts.push('project', projectRes.value()?.at(0)!.name);
      }
    }

    return router.createUrlTree(urlParts);
  }
  return true;
};

function resourceDone(sig: Signal<ResourceStatus>) {
  return firstValueFrom(
    toObservable(sig).pipe(filter((v) => v === 'resolved' || v === 'error')),
  );
}

export const authenticatedRoutes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        canActivate: [redirectToDefaultPage],
      },
      // other non-org scoped sites go here (e.g. /account/** or something like that)
      {
        path: ':organizationName',
        children: [
          {
            path: '',
            component: OrganizationDashboardComponent,
          },
          {
            path: 'monitoring',
            component: MonitoringComponent,
          },
          {
            path: 'project',
            children: [
              {
                path: ':projectName',
                children: [
                  {
                    path: '',
                    component: ProjectDashboardComponent,
                  },
                  {
                    path: 'logs',
                    component: LogsComponent,
                  },
                  {
                    path: 'deployments',
                    component: DeploymentsComponent,
                  },
                  {
                    path: 'monitoring',
                    component: MonitoringComponent,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
