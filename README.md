# SimpleNotes

> Shareable notes, checklists, and shopping lists for households

A full-stack serverless application built with AWS (Lambda, DynamoDB, S3, Cognito), FastAPI, and React. Deploy to iOS, Android, and Web from a single codebase.

## Features

- **Shopping Lists** - Never forget an item. Share lists with your household in real-time
- **Checklists** - Track tasks and to-dos. Check off items as you complete them
- **Notes** - Quick notes and reminders for you and your family
- **Household Sharing** - Invite family members and collaborate in real-time
- **Email Invites** - Send beautiful email invitations to join your household
- **Cross-Platform** - Works on iOS, Android, and Web
- **Offline Support** - PWA with offline capabilities
- **Free Tier Optimized** - Designed to stay within AWS Free Tier limits

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  React + Vite + PWA + Capacitor (iOS/Android)                   │
│  Hosted on S3 + CloudFront                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                 │
│  HTTP API with JWT Authorization (Cognito)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lambda Function                               │
│  FastAPI + Mangum (Python 3.11)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   DynamoDB   │    │   Cognito    │    │     SES      │
│   (NoSQL)    │    │   (Auth)     │    │   (Email)    │
└──────────────┘    └──────────────┘    └──────────────┘
```

## AWS Free Tier Limits

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Lambda | 1M requests/month | 400K GB-seconds |
| API Gateway | 1M calls/month | First 12 months |
| DynamoDB | 25GB storage | 25 RCU/WCU |
| S3 | 5GB storage | 20K GET, 2K PUT |
| Cognito | 50K MAU | Always free |
| SES | 62K emails/month | When sent from Lambda |

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [Terraform](https://www.terraform.io/) >= 1.0
- [Node.js](https://nodejs.org/) >= 18
- [Python](https://www.python.org/) >= 3.11
- [Google Cloud Console](https://console.cloud.google.com/) account (for OAuth)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/voidreamer/simplenotes.git
cd simplenotes
```

### 2. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth Client ID**
5. Select **Web application**
6. Add authorized redirect URIs (update after deployment):
   - `http://localhost:5173/callback`
   - `https://your-cognito-domain.auth.ca-central-1.amazoncognito.com/oauth2/idpresponse`
7. Save the Client ID and Client Secret

### 3. Configure Terraform

Create `terraform/terraform.tfvars`:

```hcl
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"
ses_email           = "your-verified-email@domain.com"  # Optional
```

### 4. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 6. Run Locally

```bash
# Frontend
cd frontend
npm run dev

# Backend (optional, for local testing)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Deployment

### Automatic Deployment (GitHub Actions)

1. Add secrets to your GitHub repository:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SES_EMAIL` (optional)

2. Push to `main` branch to trigger deployment

### Manual Deployment

```bash
# Deploy infrastructure
cd terraform
terraform apply

# Build and deploy frontend
cd frontend
npm run build
aws s3 sync dist/ s3://$(terraform output -raw frontend_bucket) --delete
```

## Mobile Apps

### iOS

```bash
cd frontend
npm run build
npx cap add ios
npx cap sync
npx cap open ios
```

Build in Xcode and submit to App Store.

### Android

```bash
cd frontend
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Build in Android Studio and submit to Play Store.

## Project Structure

```
simplenotes/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD
├── terraform/
│   ├── main.tf                # Core infrastructure
│   ├── lambda.tf              # Lambda & API Gateway
│   ├── cognito.tf             # Authentication
│   ├── variables.tf           # Configuration
│   └── outputs.tf             # Output values
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entry
│   │   ├── routes/            # API endpoints
│   │   └── utils/             # Helpers & services
│   ├── tests/                 # Pytest tests
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── stores/            # Zustand state
│   │   └── utils/             # API client & helpers
│   ├── capacitor.config.json  # Mobile config
│   └── package.json           # Node dependencies
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/households/` | List user's households |
| POST | `/api/households/` | Create household |
| GET | `/api/lists/household/{id}` | Get household lists |
| POST | `/api/lists/` | Create list |
| PATCH | `/api/lists/{id}` | Update list |
| POST | `/api/lists/{id}/items` | Add item to list |
| POST | `/api/invites/` | Send household invite |
| POST | `/api/invites/{id}/accept` | Accept invite |

## Environment Variables

### Backend (Lambda)

| Variable | Description |
|----------|-------------|
| `USERS_TABLE` | DynamoDB users table name |
| `HOUSEHOLDS_TABLE` | DynamoDB households table name |
| `LISTS_TABLE` | DynamoDB lists table name |
| `INVITES_TABLE` | DynamoDB invites table name |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `COGNITO_CLIENT_ID` | Cognito Client ID |
| `SES_EMAIL` | Verified SES sender email |

### Frontend (Runtime Config)

The frontend uses a runtime `config.js` file that's updated during deployment with Terraform outputs.

## Development

### Running Tests

```bash
# Backend
cd backend
pip install pytest pytest-cov
pytest tests/ -v

# Frontend
cd frontend
npm test
```

### Linting

```bash
cd frontend
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - feel free to use this for personal or commercial projects.

## Support

- [Report Issues](https://github.com/voidreamer/simplenotes/issues)
- [Discussions](https://github.com/voidreamer/simplenotes/discussions)
