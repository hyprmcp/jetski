import { CanActivateFn, Router, Routes } from '@angular/router';
import { OrganizationDashboardComponent } from './pages/organization-dashboard/organization-dashboard.component';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { ProjectDashboardComponent } from './pages/project/dashboard/project-dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { inject } from '@angular/core';
import { ContextService } from './services/context.service';
import { LogsComponent } from './pages/project/logs/logs.component';

const redirectToOrgDashboardGuard: CanActivateFn = () => {
  const contextService = inject(ContextService);
  const router = inject(Router);
  const orgRes = contextService.organizations;
  const orgName =
    contextService.selectedOrg()?.name ??
    (orgRes.hasValue() ? orgRes.value()?.at(0)?.name : undefined);
  if (orgName) {
    return router.createUrlTree(['/', orgName]);
  }
  return true;
};

export const authenticatedRoutes: Routes = [
  // other non-org scoped sites go here (e.g. /account/** or something like that)
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
    canActivate: [redirectToOrgDashboardGuard],
  },
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
];
