import { Routes } from '@angular/router';
import { OrganizationDashboardComponent } from './pages/organization-dashboard/organization-dashboard.component';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { ProjectDashboardComponent } from './pages/project/dashboard/project-dashboard.component';

export const authenticatedRoutes: Routes = [
  // other non-org scoped sites go here (e.g. /account/** or something like that
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
                path: 'monitoring',
                component: MonitoringComponent,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/dashboard', // TODO redirect to first or last selected org overview??
  },
];
