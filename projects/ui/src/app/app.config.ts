import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc';
import { routes } from './app.routes';
import { environment } from '../env/env';

async function initializeOAuth() {
  const oauthService = inject(OAuthService);
  console.log('configure');
  oauthService.configure({
    issuer: environment.oidc.issuer,
    redirectUri: location.origin,
    clientId: environment.oidc.clientId,
    scope: 'openid profile email',
    responseType: 'code',
    showDebugInformation: !environment.production,
  });

  console.log('try login');
  return await oauthService.loadDiscoveryDocumentAndLogin();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideOAuthClient({
      resourceServer: {
        sendAccessToken: true,
        allowedUrls: ['/api'],
      },
    }),
    provideAppInitializer(initializeOAuth),
  ],
};
