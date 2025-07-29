import { inject } from '@angular/core';
import { CanActivateFn, Routes } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

const authGuard: CanActivateFn = () => {
  const oauth = inject(OAuthService);
  return oauth.hasValidIdToken() && oauth.hasValidAccessToken();
};

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./authenticated.routes').then((m) => m.authenticatedRoutes),
      },
    ],
  },
];
