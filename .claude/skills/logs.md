# View Logs

View application and infrastructure logs for debugging.

## Usage
```
/logs api      # View Lambda API logs
/logs deploy   # View CI/CD deployment logs
```

## Lambda Logs (Backend API)

### Tail Recent Logs
```bash
# Production
aws logs tail /aws/lambda/simplebaby-prod-api --since 10m --region ca-central-1

# Staging
aws logs tail /aws/lambda/simplebaby-staging-api --since 10m --region ca-central-1
```

### Filter for Errors
```bash
aws logs tail /aws/lambda/simplebaby-prod-api --since 1h --filter-pattern "ERROR" --region ca-central-1
```

### Follow Logs Live
```bash
aws logs tail /aws/lambda/simplebaby-prod-api --follow --region ca-central-1
```

## GitHub Actions Logs

### View Recent Runs
```bash
gh run list --limit 5
```

### View Specific Run Logs
```bash
gh run view <run-id> --log
```

### View Failed Job Logs
```bash
gh run view <run-id> --log-failed
```

## CloudWatch Insights

For complex queries, use CloudWatch Logs Insights in AWS Console:
- Region: ca-central-1
- Log group: `/aws/lambda/simplebaby-prod-api`

### Example Query - Recent Errors
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 50
```

### Example Query - Slow Requests
```
fields @timestamp, @duration
| filter @duration > 1000
| sort @duration desc
| limit 20
```
