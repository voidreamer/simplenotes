#!/bin/sh
# Docker entrypoint script for frontend
# Injects runtime configuration into config.js

set -e

# Create runtime config from environment variables
cat > /usr/share/nginx/html/config.js << EOF
window.APP_CONFIG = {
  API_URL: "${API_URL:-http://localhost:8000}",
  COGNITO_CLIENT_ID: "${COGNITO_CLIENT_ID:-}",
  COGNITO_USER_POOL_ID: "${COGNITO_USER_POOL_ID:-}",
  COGNITO_DOMAIN: "${COGNITO_DOMAIN:-}",
  AWS_REGION: "${AWS_REGION:-ca-central-1}"
};
EOF

echo "Runtime config injected:"
cat /usr/share/nginx/html/config.js

# Execute the main command
exec "$@"
