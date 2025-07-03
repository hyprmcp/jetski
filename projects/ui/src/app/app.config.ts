import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc';
import { routes } from './app.routes';

async function initializeOAuth() {
  const oauthService = inject(OAuthService);
  console.log('configure');
  oauthService.configure({
    issuer: 'http://localhost:5556/dex',
    redirectUri: location.origin,
    clientId: 'ui',
    scope: 'openid profile email',
    responseType: 'code',
    showDebugInformation: true,
  });

  console.log('try login');
  return await oauthService.loadDiscoveryDocumentAndLogin();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideOAuthClient(),
    provideAppInitializer(initializeOAuth),
  ],
};
