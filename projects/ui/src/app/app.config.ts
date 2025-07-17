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

async function initializeOAuth() {
  const oauthService = inject(OAuthService);
  console.log('configure');
  oauthService.configure({
    issuer: environment.oidc.issuer,
    redirectUri: location.origin,
    clientId: environment.oidc.clientId,
    scope: 'openid profile email offline_access',
    responseType: 'code',
    showDebugInformation: !environment.production,
  });
  oauthService.setupAutomaticSilentRefresh();
  console.log('try login');
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
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
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
