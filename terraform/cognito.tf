# SimpleNotes - AWS Cognito Configuration
# User authentication with Google OAuth

# ============================================
# Cognito User Pool (Free Tier: 50,000 MAU)
# ============================================

resource "aws_cognito_user_pool" "main" {
  name = "${local.prefix}-users"

  # Username configuration
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration (use Cognito default for free tier)
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User attributes
  schema {
    name                     = "name"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Verification message
  verification_message_template {
    default_email_option = "CONFIRM_WITH_LINK"
    email_subject        = "Welcome to SimpleNotes - Verify Your Email"
    email_message        = "Welcome to SimpleNotes! Please click the link below to verify your email: {####}"
  }

  # MFA (optional, disabled for simplicity)
  mfa_configuration = "OFF"

  # Lambda triggers (can be added later)
  # lambda_config {
  #   post_confirmation = aws_lambda_function.post_confirmation.arn
  # }

  tags = {
    Name = "${local.prefix}-user-pool"
  }
}

# ============================================
# Google Identity Provider
# ============================================

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    authorize_scopes              = "profile email openid"
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = true
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://oauth2.googleapis.com/token"
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
    picture  = "picture"
  }

  lifecycle {
    ignore_changes = [provider_details["client_secret"]]
  }
}

# ============================================
# Cognito User Pool Client
# ============================================

resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.prefix}-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth configuration
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # Callback URLs (update with your domains)
  callback_urls = [
    "http://localhost:3000/callback",
    "http://localhost:5173/callback",
    "https://${aws_s3_bucket.frontend.bucket}.s3.${var.aws_region}.amazonaws.com/callback"
  ]

  logout_urls = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://${aws_s3_bucket.frontend.bucket}.s3.${var.aws_region}.amazonaws.com"
  ]

  # Token validity
  access_token_validity  = 1   # hours
  id_token_validity      = 1   # hours
  refresh_token_validity = 30  # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Supported identity providers
  supported_identity_providers = ["COGNITO", "Google"]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Enable SRP auth for password-based login
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # Don't generate client secret (for public clients like SPAs)
  generate_secret = false

  depends_on = [aws_cognito_identity_provider.google]
}

# ============================================
# Cognito Domain
# ============================================

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${local.account_id}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# ============================================
# Cognito Identity Pool (for AWS credentials)
# ============================================

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${local.prefix}-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.web.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = {
    Name = "${local.prefix}-identity-pool"
  }
}

# IAM role for authenticated users
resource "aws_iam_role" "authenticated" {
  name = "${local.prefix}-cognito-authenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })
}

# Policy for authenticated users (S3 access for attachments)
resource "aws_iam_role_policy" "authenticated" {
  name = "${local.prefix}-authenticated-policy"
  role = aws_iam_role.authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.attachments.arn}/$${cognito-identity.amazonaws.com:sub}/*"
        ]
      }
    ]
  })
}

# Attach roles to identity pool
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    authenticated = aws_iam_role.authenticated.arn
  }
}
