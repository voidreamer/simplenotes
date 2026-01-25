# Debug Authentication

Diagnose and fix authentication issues with Supabase Auth.

## Common Issues

### 1. OAuth Callback Loop (login redirects back to login)
**Check:**
- Supabase Dashboard > Authentication > URL Configuration
  - Site URL matches CloudFront domain
  - Redirect URLs include `/callback` for all environments
- Frontend `supabase.js` has `detectSessionInUrl: true`
- `Callback.jsx` properly waits for hash fragment processing

### 2. 401 Unauthorized from API
**Check:**
- Lambda has `SUPABASE_JWT_SECRET` environment variable set
- Token is being sent in Authorization header
- JWT secret matches Supabase project settings

**Debug commands:**
```bash
# Check Lambda env vars
aws lambda get-function-configuration --function-name simplebaby-prod-api --query 'Environment.Variables' --region ca-central-1

# Check if JWT secret is set (shows if empty)
aws lambda get-function-configuration --function-name simplebaby-prod-api --query 'Environment.Variables.SUPABASE_JWT_SECRET' --region ca-central-1
```

### 3. User Data Not Showing (wrong user_id)
**Check:**
- User's Supabase ID matches database `user_id`
- Get current user ID from browser console:
  ```javascript
  (await supabase.auth.getUser()).data.user.id
  ```

**Fix user_id in database:**
```sql
-- Check current user
SELECT * FROM babies WHERE owner_email = 'user@email.com';

-- Update user_id (use public schema for prod, staging for staging)
UPDATE babies SET user_id = 'new-supabase-uuid' WHERE owner_email = 'user@email.com';
```

### 4. CORS Errors
**Check:**
- Lambda `CORS_ORIGINS` env var includes the frontend domain
- For local dev, should include `http://localhost:5173`

## Quick Diagnostics
```bash
# Check GitHub secrets exist
gh secret list

# Check recent deployments
gh run list --limit 5

# View Lambda logs
aws logs tail /aws/lambda/simplebaby-prod-api --since 10m --region ca-central-1
```
