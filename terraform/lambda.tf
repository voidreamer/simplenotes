# SimpleNotes - Lambda & API Gateway Configuration
# FastAPI Backend with Mangum Adapter

# ============================================
# IAM Role for Lambda
# ============================================

resource "aws_iam_role" "lambda_exec" {
  name = "${local.prefix}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_exec" {
  name = "${local.prefix}-lambda-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          aws_dynamodb_table.households.arn,
          "${aws_dynamodb_table.households.arn}/index/*",
          aws_dynamodb_table.lists.arn,
          "${aws_dynamodb_table.lists.arn}/index/*",
          aws_dynamodb_table.invites.arn,
          "${aws_dynamodb_table.invites.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.attachments.arn,
          "${aws_s3_bucket.attachments.arn}/*"
        ]
      }
    ]
  })
}

# ============================================
# Lambda Function
# ============================================

# Package the Lambda code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/../backend.zip"
  excludes    = ["__pycache__", "*.pyc", ".pytest_cache", "venv", ".venv", "tests"]
}

# Upload to S3
resource "aws_s3_object" "lambda_code" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "backend-${data.archive_file.lambda_zip.output_md5}.zip"
  source = data.archive_file.lambda_zip.output_path
  etag   = data.archive_file.lambda_zip.output_md5
}

# Lambda function
resource "aws_lambda_function" "api" {
  function_name = local.function_name
  description   = "SimpleNotes API - FastAPI with Mangum"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_code.key

  runtime = "python3.11"
  handler = "app.main.handler"

  memory_size = 512
  timeout     = 30

  role = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      ENVIRONMENT          = var.environment
      USERS_TABLE          = aws_dynamodb_table.users.name
      HOUSEHOLDS_TABLE     = aws_dynamodb_table.households.name
      LISTS_TABLE          = aws_dynamodb_table.lists.name
      INVITES_TABLE        = aws_dynamodb_table.invites.name
      ATTACHMENTS_BUCKET   = aws_s3_bucket.attachments.id
      SUPABASE_URL         = var.supabase_url
      SUPABASE_JWT_SECRET  = var.supabase_jwt_secret
      SES_EMAIL            = var.ses_email
      FRONTEND_URL         = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
      CLOUDFRONT_URL       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
    }
  }

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  tags = {
    Name = local.function_name
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 14  # Free tier friendly

  tags = {
    Name = "${local.prefix}-api-logs"
  }
}

# ============================================
# API Gateway (HTTP API - cheaper than REST)
# ============================================

resource "aws_apigatewayv2_api" "main" {
  name          = "${local.prefix}-api"
  description   = "SimpleNotes HTTP API"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    allow_methods     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_origins     = concat(
      [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://${aws_cloudfront_distribution.frontend.domain_name}"
      ],
      var.domain_name != "" ? ["https://${var.domain_name}"] : []
    )
    expose_headers    = ["*"]
    max_age           = 3600
  }

  tags = {
    Name = "${local.prefix}-api"
  }
}

# Lambda integration
resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.api.invoke_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

# Default route (catch-all)
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# API routes (auth handled by Lambda/FastAPI with Supabase JWT)
resource "aws_apigatewayv2_route" "api" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# OPTIONS preflight route (no auth required for CORS preflight)
resource "aws_apigatewayv2_route" "api_options" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "OPTIONS /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Public routes (health check, docs)
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "docs" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /docs"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "openapi" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /openapi.json"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Stage (auto-deploy)
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    })
  }

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }

  tags = {
    Name = "${local.prefix}-stage"
  }
}

# API Gateway logs
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.prefix}"
  retention_in_days = 14

  tags = {
    Name = "${local.prefix}-api-gateway-logs"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
