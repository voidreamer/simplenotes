# SimpleNotes - Terraform Variables
# AWS Serverless Notes/Lists App

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ca-central-1"  # Canada Central
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "simplenotes"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_jwt_secret" {
  description = "Supabase JWT secret for token verification"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Custom domain name (optional, e.g., notes.heybub.app)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for the custom domain (required if domain_name is set)"
  type        = string
  default     = ""
}

variable "ses_email" {
  description = "Verified SES email for sending invites"
  type        = string
  default     = ""
}

# Tags for all resources
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "SimpleNotes"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}
