# SimpleNotes - Main Terraform Configuration
# AWS Serverless Architecture - Free Tier Optimized

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Remote backend for state management
  # State is stored per workspace (staging/prod)
  backend "s3" {
    bucket       = "simplenotes-terraform-state-523874366849"
    key          = "terraform.tfstate"
    region       = "ca-central-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables
locals {
  account_id    = data.aws_caller_identity.current.account_id
  region        = data.aws_region.current.name
  function_name = "${var.project_name}-api-${var.environment}"

  # Resource naming
  prefix = "${var.project_name}-${var.environment}"
}

# ============================================
# DynamoDB Tables (Free Tier: 25GB, 25 RCU/WCU)
# ============================================

resource "aws_dynamodb_table" "users" {
  name         = "${local.prefix}-users"
  billing_mode = "PAY_PER_REQUEST"  # On-demand for free tier friendly scaling
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = {
    Name = "${local.prefix}-users"
  }
}

resource "aws_dynamodb_table" "households" {
  name         = "${local.prefix}-households"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "household_id"

  attribute {
    name = "household_id"
    type = "S"
  }

  attribute {
    name = "owner_id"
    type = "S"
  }

  global_secondary_index {
    name            = "owner-index"
    hash_key        = "owner_id"
    projection_type = "ALL"
  }

  tags = {
    Name = "${local.prefix}-households"
  }
}

resource "aws_dynamodb_table" "lists" {
  name         = "${local.prefix}-lists"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "list_id"
  range_key    = "household_id"

  attribute {
    name = "list_id"
    type = "S"
  }

  attribute {
    name = "household_id"
    type = "S"
  }

  global_secondary_index {
    name            = "household-index"
    hash_key        = "household_id"
    projection_type = "ALL"
  }

  tags = {
    Name = "${local.prefix}-lists"
  }
}

resource "aws_dynamodb_table" "invites" {
  name         = "${local.prefix}-invites"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "invite_id"

  attribute {
    name = "invite_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "household_id"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "household-index"
    hash_key        = "household_id"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  tags = {
    Name = "${local.prefix}-invites"
  }
}

# ============================================
# S3 Buckets
# ============================================

# Frontend hosting bucket
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.prefix}-frontend-${local.account_id}"

  tags = {
    Name = "${local.prefix}-frontend"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # SPA routing
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# File attachments bucket
resource "aws_s3_bucket" "attachments" {
  bucket = "${local.prefix}-attachments-${local.account_id}"

  tags = {
    Name = "${local.prefix}-attachments"
  }
}

resource "aws_s3_bucket_cors_configuration" "attachments" {
  bucket = aws_s3_bucket.attachments.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]  # Update with your domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lambda deployment bucket
resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "${local.prefix}-lambda-${local.account_id}"

  tags = {
    Name = "${local.prefix}-lambda"
  }
}
