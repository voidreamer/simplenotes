// App configuration from runtime config.js
declare global {
  interface Window {
    APP_CONFIG?: {
      API_URL: string;
      COGNITO_CLIENT_ID: string;
      COGNITO_USER_POOL_ID: string;
      COGNITO_DOMAIN: string;
      AWS_REGION: string;
    };
  }
}

const config = {
  apiUrl: window.APP_CONFIG?.API_URL || 'http://localhost:8000',
  cognito: {
    userPoolId: window.APP_CONFIG?.COGNITO_USER_POOL_ID || '',
    clientId: window.APP_CONFIG?.COGNITO_CLIENT_ID || '',
    domain: window.APP_CONFIG?.COGNITO_DOMAIN || '',
    region: window.APP_CONFIG?.AWS_REGION || 'ca-central-1',
  },
  isProduction: import.meta.env.PROD,
};

export default config;
