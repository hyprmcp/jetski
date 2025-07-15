import { RemoteEnvironment } from './types';

export async function getRemoteEnvironment(): Promise<RemoteEnvironment> {
  const cached = sessionStorage['remoteEnvironment'];
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error('failed to parse remote environment json', e);
    }
  }
  const result = await (await fetch('/internal/environment')).json();
  sessionStorage['remoteEnvironment'] = JSON.stringify(result);
  return result;
}
