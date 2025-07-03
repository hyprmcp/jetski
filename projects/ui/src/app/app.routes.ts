import { inject } from '@angular/core';
import { CanActivateFn, Routes } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { HomeComponent } from './home/home.component';

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
      /* Routes that require authentication go here */
      {
        path: '',
        pathMatch: 'full',
        component: HomeComponent,
      },
    ],
  },
  /* Routes that don't require authentication go here */
];
