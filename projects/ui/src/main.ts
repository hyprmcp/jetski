import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { getRemoteEnvironment } from './env/remote';
import * as Sentry from '@sentry/angular';
import { environment } from './env/env';
import { buildConfig } from './buildconfig';
import posthog from 'posthog-js';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

(async () => {
  const remoteEnvironment = await getRemoteEnvironment();

  if (remoteEnvironment.sentryDsn) {
    Sentry.init({
      enabled: environment.production,
      release: buildConfig.version ?? buildConfig.commit,
      dsn: remoteEnvironment.sentryDsn,
      environment: remoteEnvironment.sentryEnvironment,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: remoteEnvironment.sentryTraceSampleRate ?? 1,
    });
  }

  if (remoteEnvironment.posthogToken) {
    posthog.init(remoteEnvironment.posthogToken, {
      api_host: remoteEnvironment.posthogApiHost,
      ui_host: remoteEnvironment.posthogUiHost,
      person_profiles: 'identified_only',
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
          password: true,
        },
        maskTextSelector: '[contenteditable], [data-ph-mask-text]',
      },
      // pageview event capturing is done for Angular router events.
      // Here we prevent the window "load" event from triggering a duplicate pageview event.
      capture_pageview: false,
      before_send: [
        (cr) => {
          if (cr !== null) {
            if (cr.$set === undefined) {
              cr.$set = {};
            }
            if (cr.$set_once === undefined) {
              cr.$set_once = {};
            }
            cr.$set['version'] = buildConfig.version;
            cr.$set_once['initial_version'] = buildConfig.version;
          }
          return cr;
        },
      ],
    });
  }
})().catch((err) => console.error(err));
