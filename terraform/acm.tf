# SimpleNotes - ACM Certificate for Custom Domain
# Certificate must be in us-east-1 for CloudFront

# ============================================
# ACM Certificate (only if custom domain is set)
# ============================================

resource "aws_acm_certificate" "frontend" {
  count    = var.domain_name != "" ? 1 : 0
  provider = aws.us_east_1

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.prefix}-frontend-cert"
  }
}

# ============================================
# DNS Validation Records
# NOTE: You need to add these CNAME records to your DNS provider
# The values are output after terraform apply
# ============================================

# Output the validation records for manual DNS setup
output "acm_validation_records" {
  description = "DNS records to add for ACM certificate validation"
  value = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.frontend[0].domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  } : {}
}

# ============================================
# Wait for certificate validation
# ============================================

resource "aws_acm_certificate_validation" "frontend" {
  count    = var.domain_name != "" ? 1 : 0
  provider = aws.us_east_1

  certificate_arn = aws_acm_certificate.frontend[0].arn

  # This will wait for the certificate to be validated
  # You must add the DNS records first!
  timeouts {
    create = "30m"
  }
}
