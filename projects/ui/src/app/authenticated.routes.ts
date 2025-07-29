import { CanActivateFn, Router, Routes } from '@angular/router';
import { OrganizationDashboardComponent } from './pages/organization-dashboard/organization-dashboard.component';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { ProjectDashboardComponent } from './pages/project/dashboard/project-dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { inject } from '@angular/core';
import { ContextService } from './services/context.service';
import { LogsComponent } from './pages/project/logs/logs.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AppShellComponent } from './app-shell.component';

const redirectToOrgDashboardGuard: CanActivateFn = async () => {
  const contextService = inject(ContextService);
  const router = inject(Router);
  const orgRes = contextService.organizations;
  await firstValueFrom(
    toObservable(orgRes.status).pipe(
      filter((v) => v === 'resolved' || v === 'error'),
    ),
  );
  const orgName =
    contextService.selectedOrg()?.name ??
    (orgRes.hasValue() ? orgRes.value()?.at(0)?.name : undefined);
  if (orgName) {
    return router.createUrlTree(['/', orgName]);
  }
  return true;
};

export const authenticatedRoutes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        canActivate: [redirectToOrgDashboardGuard],
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
