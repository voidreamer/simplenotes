# Check Deployment Status

Monitor CI/CD pipeline and deployment status.

## Usage
```
/check-deploy          # Show recent workflow runs
/check-deploy staging  # Check staging deployment
/check-deploy prod     # Check production deployment
```

## Commands

### List Recent Runs
```bash
gh run list --limit 5
```

### Watch Active Run
```bash
gh run watch
```

### View Specific Run Details
```bash
gh run view <run-id>
```

### View Run Logs
```bash
gh run view <run-id> --log
```

### Check Specific Job
```bash
gh run view <run-id> --job <job-id>
```

## Infrastructure Outputs

### Get Terraform Outputs (after deploy)
```bash
cd infra
terraform init -backend-config="key=prod/terraform.tfstate"
terraform output
```

### Check CloudFront Distribution
```bash
aws cloudfront get-distribution --id <distribution-id> --query 'Distribution.Status'
```

### Check Lambda Function
```bash
aws lambda get-function --function-name simplebaby-prod-api --query 'Configuration.LastModified' --region ca-central-1
```

## URLs
- **Staging:** Check CloudFront domain from Terraform outputs
- **Production:** https://d3nsr7lzhub0bz.cloudfront.net/
