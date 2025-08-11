import { Environment } from './types';

export const environment: Environment = {
  production: true,
  oidc: {
    issuer: 'https://auth.jetski.sh',
    clientId: 'ui',
  },
};
