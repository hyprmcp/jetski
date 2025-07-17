import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProjectDashboardComponent } from './pages/project/dashboard/project-dashboard.component';

export const authenticatedRoutes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'users',
    component: UsersComponent,
  },
  {
    path: 'monitoring',
    component: MonitoringComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },
  {
    path: 'project/:projectId',
    children: [
      { path: '', pathMatch: 'full', component: ProjectDashboardComponent },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/dashboard',
  },
];
