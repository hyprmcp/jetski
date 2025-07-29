import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  OAuthService,
  OAuthStorage,
  provideOAuthClient,
} from 'angular-oauth2-oidc';
import { routes } from './app.routes';
import { environment } from '../env/env';
import * as Sentry from '@sentry/angular';
import { authInterceptor } from './auth.interceptor';

async function initializeOAuth() {
  const oauthService = inject(OAuthService);
  oauthService.configure({
    issuer: environment.oidc.issuer,
    redirectUri: location.origin,
    clientId: environment.oidc.clientId,
    scope: 'openid profile email offline_access',
    responseType: 'code',
    showDebugInformation: !environment.production,
    clockSkewInSec: 0,
  });
  oauthService.setupAutomaticSilentRefresh();
  return await oauthService.loadDiscoveryDocumentAndLogin();
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler(),
    },
    provideAppInitializer(async () => inject(Sentry.TraceService)),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withInterceptorsFromDi(),
      withFetch(),
    ),
    provideOAuthClient({
      resourceServer: {
        sendAccessToken: true,
        allowedUrls: ['/api'],
      },
    }),
    provideAppInitializer(initializeOAuth),
    { provide: OAuthStorage, useFactory: storageFactory },
  ],
};

function storageFactory(): OAuthStorage {
  return localStorage;
}
