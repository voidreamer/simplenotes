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

variable "google_client_id" {
  description = "Google OAuth Client ID for Cognito"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret for Cognito"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Custom domain name (optional)"
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
