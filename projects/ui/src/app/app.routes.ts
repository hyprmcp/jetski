import { inject } from '@angular/core';
import { CanActivateFn, Routes } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

const authGuard: CanActivateFn = () => {
  const oauth = inject(OAuthService);
  if (oauth.hasValidIdToken()) {
    console.log('auth guard true');
    return true;
  } else {
    console.log('auth guard false');
    return false;
  }
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
  /* Routes that don't require authentication go here */
];
