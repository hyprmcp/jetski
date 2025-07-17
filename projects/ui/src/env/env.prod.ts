import { Environment } from './types';

export const environment: Environment = {
  production: true,
  oidc: {
    issuer: 'https://', // TODO
    clientId: 'ui', // TODO
  },
};
