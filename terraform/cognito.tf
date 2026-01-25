# SimpleNotes - AWS Cognito Configuration (DEPRECATED)
# Migrated to Supabase Auth
# This file is kept for reference during migration cleanup
# TODO: Remove Cognito resources after migration is complete

# The following resources have been migrated to Supabase:
# - User authentication -> Supabase Auth
# - Google OAuth -> Supabase Google Provider
# - JWT validation -> Supabase JWT with HS256

# To clean up Cognito resources after successful migration:
# 1. Run: terraform state rm aws_cognito_user_pool.main
# 2. Run: terraform state rm aws_cognito_identity_provider.google
# 3. Run: terraform state rm aws_cognito_user_pool_client.web
# 4. Run: terraform state rm aws_cognito_user_pool_domain.main
# 5. Run: terraform state rm aws_cognito_identity_pool.main
# 6. Run: terraform state rm aws_iam_role.authenticated
# 7. Run: terraform state rm aws_iam_role_policy.authenticated
# 8. Run: terraform state rm aws_cognito_identity_pool_roles_attachment.main
# 9. Manually delete the Cognito resources in AWS Console if needed
