# Docker Deployment Guide

SimpleNotes supports two Docker deployment options:
1. **Local Development** - Docker Compose for running locally
2. **Cloud Deployment** - ECS Fargate for production

---

## Quick Start: Local Development

### Prerequisites
- Docker Desktop installed
- AWS credentials configured (for DynamoDB access)
- Cognito credentials from your staging/prod environment

### 1. Set Up Environment

```bash
# Copy the example environment file
cp .env.docker.example .env

# Edit .env with your credentials
# Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# Optional: COGNITO_* variables for authentication
```

### 2. Start Services

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. Development Workflow

```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# Restart a service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## Local Development with Local DynamoDB

For fully offline development, use the local DynamoDB:

```bash
# Start with local DynamoDB profile
docker compose --profile local up --build
```

Then update your `.env`:
```env
DYNAMODB_ENDPOINT=http://dynamodb-local:8000
```

---

## Cloud Deployment: ECS Fargate

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ECS Fargate Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Internet                                                  │
│       │                                                     │
│       ▼                                                     │
│   ┌───────────────┐                                        │
│   │      ALB      │  Application Load Balancer             │
│   └───────┬───────┘                                        │
│           │                                                 │
│     ┌─────┴─────┐                                          │
│     │           │                                           │
│     ▼           ▼                                           │
│ ┌───────┐  ┌───────┐                                       │
│ │Frontend│  │Backend│   ECS Fargate Tasks                  │
│ │ :80   │  │ :8000 │                                       │
│ └───────┘  └───┬───┘                                       │
│                │                                            │
│                ▼                                            │
│         ┌──────────┐                                        │
│         │ DynamoDB │                                        │
│         └──────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Prerequisites

1. VPC with public and private subnets
2. Cognito User Pool (can use existing from Lambda deployment)
3. DynamoDB tables (can use existing)

### Deploy with Terraform

1. **Add VPC module** (if you don't have one):

```hcl
# terraform/vpc.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "simplenotes-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["ca-central-1a", "ca-central-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true  # Cost savings for non-prod

  tags = local.tags
}
```

2. **Enable ECS module**:

```hcl
# terraform/ecs.tf
module "ecs" {
  source = "./modules/ecs"

  project_name = "simplenotes"
  environment  = var.environment
  aws_region   = var.aws_region

  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnets
  private_subnet_ids = module.vpc.private_subnets

  cognito_user_pool_id = aws_cognito_user_pool.main.id
  cognito_client_id    = aws_cognito_user_pool_client.web.id
  cognito_domain       = "${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"

  backend_desired_count = 1
  backend_max_count     = 4
  frontend_desired_count = 1

  tags = local.tags
}
```

3. **Apply Terraform**:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Build and Push Docker Images

After Terraform creates the ECR repositories:

```bash
# Login to ECR
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ca-central-1.amazonaws.com

# Build and push backend
cd backend
docker build -t simplenotes-backend .
docker tag simplenotes-backend:latest <account-id>.dkr.ecr.ca-central-1.amazonaws.com/simplenotes-staging-backend:latest
docker push <account-id>.dkr.ecr.ca-central-1.amazonaws.com/simplenotes-staging-backend:latest

# Build and push frontend
cd ../frontend
docker build -t simplenotes-frontend .
docker tag simplenotes-frontend:latest <account-id>.dkr.ecr.ca-central-1.amazonaws.com/simplenotes-staging-frontend:latest
docker push <account-id>.dkr.ecr.ca-central-1.amazonaws.com/simplenotes-staging-frontend:latest

# Force new deployment
aws ecs update-service --cluster simplenotes-staging --service backend --force-new-deployment
aws ecs update-service --cluster simplenotes-staging --service frontend --force-new-deployment
```

---

## Comparison: Lambda vs ECS Fargate

| Aspect | Lambda (Current) | ECS Fargate |
|--------|-----------------|-------------|
| **Cost at low traffic** | ~$0-5/month | ~$15-30/month |
| **Cost at high traffic** | Can be expensive | More predictable |
| **Cold starts** | Yes (100-500ms) | No |
| **Scaling** | Automatic, instant | Auto-scaling rules |
| **Max execution time** | 15 minutes | Unlimited |
| **Container control** | Limited | Full control |
| **Local dev parity** | Different | Same containers |

### When to Use Lambda (Current Setup)
- Low/variable traffic
- Cost-sensitive
- Simple CRUD operations
- Event-driven workloads

### When to Use ECS Fargate
- Consistent traffic
- Long-running operations
- WebSocket connections
- Need same environment locally and in production
- Want to avoid cold starts

---

## CI/CD for Docker Deployments

Your existing GitHub Actions workflow already has AWS credentials configured via `secrets.AWS_ACCESS_KEY_ID` and `secrets.AWS_SECRET_ACCESS_KEY`. To add ECS deployment, create a new workflow:

```yaml
# .github/workflows/deploy-ecs.yml
name: Deploy to ECS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ca-central-1

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          # These come from GitHub repository secrets (already configured!)
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/simplenotes-prod-backend:${{ github.sha }} ./backend
          docker tag $ECR_REGISTRY/simplenotes-prod-backend:${{ github.sha }} $ECR_REGISTRY/simplenotes-prod-backend:latest
          docker push $ECR_REGISTRY/simplenotes-prod-backend:${{ github.sha }}
          docker push $ECR_REGISTRY/simplenotes-prod-backend:latest

      - name: Build and push frontend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/simplenotes-prod-frontend:${{ github.sha }} ./frontend
          docker tag $ECR_REGISTRY/simplenotes-prod-frontend:${{ github.sha }} $ECR_REGISTRY/simplenotes-prod-frontend:latest
          docker push $ECR_REGISTRY/simplenotes-prod-frontend:${{ github.sha }}
          docker push $ECR_REGISTRY/simplenotes-prod-frontend:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster simplenotes-prod --service backend --force-new-deployment
          aws ecs update-service --cluster simplenotes-prod --service frontend --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable --cluster simplenotes-prod --services backend frontend
```

> **Note**: The AWS credentials are already stored in your GitHub repository secrets from the Lambda deployment setup. The ECS workflow reuses the same secrets - no additional configuration needed!

---

## Troubleshooting

### Container won't start
```bash
# Check ECS service events
aws ecs describe-services --cluster simplenotes-staging --services backend

# Check CloudWatch logs
aws logs tail /ecs/simplenotes-staging/backend --follow
```

### Health check failing
```bash
# Test locally first
docker compose up --build
curl http://localhost:8000/health
```

### Permission denied
Ensure the ECS task role has DynamoDB permissions and the execution role can pull from ECR.
