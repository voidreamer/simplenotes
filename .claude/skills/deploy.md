# Deploy

Deploy changes to staging or production environments.

## Usage
```
/deploy staging   # Deploy to staging
/deploy prod      # Deploy to production
/deploy both      # Deploy to both (staging first, then prod)
```

## Process

### Staging
1. Commit any pending changes
2. Push to `staging` branch
3. CI/CD will automatically deploy via GitHub Actions

### Production
1. Commit any pending changes
2. Push to `main` branch
3. CI/CD will automatically deploy via GitHub Actions

### Both
1. Push to `staging` first
2. After staging push, merge staging to `main` and push

## Post-deploy
- Check GitHub Actions for deployment status: `gh run list --limit 3`
- Monitor for any errors in the workflow run
