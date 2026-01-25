# SimpleNotes - Terraform Outputs

output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "frontend_url" {
  description = "CloudFront frontend URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_bucket" {
  description = "S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.id
}

output "attachments_bucket" {
  description = "S3 bucket for file attachments"
  value       = aws_s3_bucket.attachments.id
}

output "supabase_url" {
  description = "Supabase project URL"
  value       = var.supabase_url
  sensitive   = true
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    users      = aws_dynamodb_table.users.name
    households = aws_dynamodb_table.households.name
    lists      = aws_dynamodb_table.lists.name
    invites    = aws_dynamodb_table.invites.name
  }
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}
