# SimpleNotes

[![Deploy](https://github.com/voidreamer/simplenotes/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/voidreamer/simplenotes/actions/workflows/ci-cd.yml)
[![Terraform](https://img.shields.io/badge/Terraform-1.0+-purple.svg)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/)

> Shareable notes, checklists, and shopping lists for households — fully serverless on AWS.

## ✨ Features

- **Household Sharing** — Real-time collaboration with family members
- **Cross-Platform** — iOS, Android, and Web from a single React codebase
- **Offline Support** — PWA with offline capabilities
- **Free Tier Optimized** — Designed to stay within AWS Free Tier limits

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                       │
│              S3 + CloudFront | Capacitor (iOS/Android)           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API Gateway (HTTP API)                        │
│                    JWT Auth via Cognito                           │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Lambda (FastAPI + Mangum)                       │
│                       Python 3.11                                 │
└───────────┬──────────────────┼───────────────────┬───────────────┘
            │                  │                   │
            ▼                  ▼                   ▼
     ┌──────────┐       ┌──────────┐        ┌──────────┐
     │ DynamoDB │       │ Cognito  │        │   SES    │
     │  4 tables│       │  OAuth   │        │  Emails  │
     └──────────┘       └──────────┘        └──────────┘
```

---

## 🚀 Infrastructure (Terraform)

All infrastructure is defined as code in `/terraform`:

| Resource | Purpose |
|----------|---------|
| `main.tf` | S3 buckets, IAM roles |
| `lambda.tf` | Lambda function, API Gateway |
| `cognito.tf` | User Pool, Google OAuth integration |
| `cloudfront.tf` | CDN distribution |

### Deploy Infrastructure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Google OAuth credentials

terraform init
terraform plan
terraform apply
```

---

## 🔄 CI/CD (GitHub Actions)

Fully automated deployment pipeline in `.github/workflows/ci-cd.yml`:

```
Push to main
    │
    ├─→ Terraform Plan/Apply (infrastructure)
    │
    ├─→ Build Lambda (Python)
    │       └─→ Deploy to AWS Lambda
    │
    └─→ Build Frontend (React)
            └─→ Sync to S3 + Invalidate CloudFront
```

### Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth secret |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript, Zustand |
| **Mobile** | Capacitor (iOS/Android from same codebase) |
| **Backend** | FastAPI, Mangum (Lambda adapter) |
| **Database** | DynamoDB (4 tables: users, households, lists, invites) |
| **Auth** | Cognito + Google OAuth |
| **Infra** | Terraform, GitHub Actions |
| **CDN** | CloudFront + S3 |

---

## 📁 Project Structure

```
simplenotes/
├── terraform/           # Infrastructure as Code
│   ├── main.tf
│   ├── lambda.tf
│   ├── cognito.tf
│   └── cloudfront.tf
├── backend/             # FastAPI Lambda
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   └── utils/
│   └── tests/
├── frontend/            # React + Capacitor
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── stores/
│   └── capacitor.config.json
└── .github/workflows/   # CI/CD
    └── ci-cd.yml
```

---

## 🏃 Local Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 📱 Mobile Builds

```bash
# iOS
npx cap add ios && npx cap sync && npx cap open ios

# Android
npx cap add android && npx cap sync && npx cap open android
```

---

## 📄 License

MIT
