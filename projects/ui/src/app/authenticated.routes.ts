import { CanActivateFn, Router, Routes } from '@angular/router';
import { OrganizationDashboardComponent } from './pages/organization-dashboard/organization-dashboard.component';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { ProjectDashboardComponent } from './pages/project/dashboard/project-dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { inject, ResourceStatus, Signal } from '@angular/core';
import { ContextService } from './services/context.service';
import { LogsComponent } from './pages/project/logs/logs.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AppShellComponent } from './app-shell.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountNewComponent } from './pages/account-new/account-new.component';

const redirectToDefaultPage: CanActivateFn = async () => {
  const contextService = inject(ContextService);
  const router = inject(Router);
  const contextRes = contextService.context;
  await resourceDone(contextRes.status);
  const orgName =
    contextService.selectedOrg()?.name ??
    (contextRes.hasValue()
      ? contextRes.value()?.organizations?.at(0)?.name
      : undefined);
  if (orgName) {
    const urlParts = ['/', orgName];
    if (
      contextRes.hasValue() &&
      contextRes.value()?.organizations?.length === 1 &&
      contextRes.value()?.projects?.length === 1
    ) {
      urlParts.push('project', contextRes.value()!.projects!.at(0)!.name);
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

export const contextGuard: CanActivateFn = async (route, state) => {
  const contextService = inject(ContextService);
  const router = inject(Router);
  const contextRes = contextService.context;
  await resourceDone(contextRes.status);
  if (contextRes.hasValue()) {
    return true;
  } else {
    const err = contextRes.error();
    if (err instanceof HttpErrorResponse && err.status === 404) {
      if (state.url === '/account/new') {
        return true;
      }
      return router.createUrlTree(['/account/new']);
    }
    return false;
  }
};

// Guard for /account/new: only allow if context 404
export const accountNewGuard: CanActivateFn = () => {
  const contextService = inject(ContextService);
  const contextRes = contextService.context;
  const err = contextRes.error();
  return err instanceof HttpErrorResponse && err.status === 404;
};

export const authenticatedRoutes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    canActivateChild: [contextGuard],
    children: [
      {
        path: '',
        component: HomeComponent,
        canActivate: [redirectToDefaultPage],
      },
      {
        path: 'account/new',
        component: AccountNewComponent,
        canActivate: [accountNewGuard],
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
    ],
  },
];
