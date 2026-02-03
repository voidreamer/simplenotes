# SimpleNotes - ACM Certificate for Custom Domain
# 
# NOTE: The ACM certificate should be created separately (once) in us-east-1
# and the ARN passed via the acm_certificate_arn variable.
#
# To create a certificate manually:
# 1. Go to AWS ACM Console in us-east-1 (N. Virginia)
# 2. Request a public certificate for your domain (e.g., notes.heybub.app)
# 3. Complete DNS validation by adding the CNAME record
# 4. Copy the certificate ARN and add it to GitHub secrets as ACM_CERTIFICATE_ARN
#
# For wildcard certs (*.heybub.app), you can reuse the same cert across apps.
