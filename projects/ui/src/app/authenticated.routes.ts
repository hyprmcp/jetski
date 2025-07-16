import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { SettingsComponent } from './pages/settings/settings.component';

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
];
