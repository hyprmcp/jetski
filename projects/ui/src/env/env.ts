import { Environment } from './types';

export const environment: Environment = {
  production: false,
  oidc: {
    issuer: 'http://localhost:5556/dex',
    clientId: 'ui',
  },
};
