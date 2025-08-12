import { Environment } from './types';

export const environment: Environment = {
  production: false,
  oidc: {
    issuer: 'http://host.minikube.internal:5556',
    clientId: 'ui',
  },
};
