// Runtime configuration - populated during deployment
// These values are replaced by Terraform outputs during CI/CD
window.APP_CONFIG = {
  API_URL: "__API_URL__",
  COGNITO_CLIENT_ID: "__COGNITO_CLIENT_ID__",
  COGNITO_USER_POOL_ID: "__COGNITO_USER_POOL_ID__",
  COGNITO_DOMAIN: "__COGNITO_DOMAIN__",
  AWS_REGION: "__AWS_REGION__"
};
