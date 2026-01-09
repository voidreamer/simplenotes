import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './InfraLearn.css';

interface Section {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

export default function InfraLearn() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const sections: Section[] = [
    {
      id: 'overview',
      title: 'Architecture Overview',
      icon: '🏗️',
      content: <OverviewSection />
    },
    {
      id: 'aws',
      title: 'AWS Services',
      icon: '☁️',
      content: <AWSSection expandedCode={expandedCode} setExpandedCode={setExpandedCode} />
    },
    {
      id: 'terraform',
      title: 'Terraform IaC',
      icon: '🔧',
      content: <TerraformSection expandedCode={expandedCode} setExpandedCode={setExpandedCode} />
    },
    {
      id: 'cicd',
      title: 'CI/CD Pipeline',
      icon: '🚀',
      content: <CICDSection expandedCode={expandedCode} setExpandedCode={setExpandedCode} />
    },
    {
      id: 'environments',
      title: 'Staging & Production',
      icon: '🌍',
      content: <EnvironmentsSection />
    },
    {
      id: 'security',
      title: 'Security & IAM',
      icon: '🔐',
      content: <SecuritySection expandedCode={expandedCode} setExpandedCode={setExpandedCode} />
    },
    {
      id: 'costs',
      title: 'Cost Optimization',
      icon: '💰',
      content: <CostsSection />
    },
    {
      id: 'interview',
      title: 'Interview Prep',
      icon: '💼',
      content: <InterviewSection />
    }
  ];

  return (
    <div className="infra-learn">
      <header className="infra-learn__header">
        <button onClick={() => navigate(-1)} className="infra-learn__back">
          ← Back
        </button>
        <div className="infra-learn__title">
          <h1>Infrastructure Deep Dive</h1>
          <p>Learn how this app was built with AWS, Terraform & GitHub Actions</p>
        </div>
      </header>

      <div className="infra-learn__layout">
        <nav className="infra-learn__nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`infra-learn__nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-title">{section.title}</span>
            </button>
          ))}
        </nav>

        <main className="infra-learn__content">
          {sections.find(s => s.id === activeSection)?.content}
        </main>
      </div>
    </div>
  );
}

// ============================================
// SECTION COMPONENTS
// ============================================

function OverviewSection() {
  return (
    <div className="section">
      <h2>🏗️ Architecture Overview</h2>

      <div className="diagram">
        <div className="diagram__title">SimpleNotes Infrastructure</div>
        <div className="diagram__flow">
          <div className="diagram__layer diagram__layer--user">
            <div className="diagram__box diagram__box--user">
              <span>👤</span>
              <label>User</label>
            </div>
          </div>

          <div className="diagram__arrow">↓</div>

          <div className="diagram__layer diagram__layer--cdn">
            <div className="diagram__box diagram__box--cloudfront">
              <span>🌐</span>
              <label>CloudFront CDN</label>
              <small>HTTPS, Caching, Global Edge</small>
            </div>
          </div>

          <div className="diagram__arrow diagram__arrow--split">
            <span>↙️ Static Files</span>
            <span>API Calls ↘️</span>
          </div>

          <div className="diagram__layer diagram__layer--services">
            <div className="diagram__box diagram__box--s3">
              <span>📦</span>
              <label>S3 Bucket</label>
              <small>React Frontend</small>
            </div>
            <div className="diagram__box diagram__box--apigw">
              <span>🚪</span>
              <label>API Gateway</label>
              <small>HTTP API + JWT Auth</small>
            </div>
          </div>

          <div className="diagram__arrow">↓</div>

          <div className="diagram__layer diagram__layer--compute">
            <div className="diagram__box diagram__box--lambda">
              <span>⚡</span>
              <label>Lambda</label>
              <small>FastAPI + Mangum</small>
            </div>
            <div className="diagram__box diagram__box--cognito">
              <span>🔑</span>
              <label>Cognito</label>
              <small>Google OAuth</small>
            </div>
          </div>

          <div className="diagram__arrow">↓</div>

          <div className="diagram__layer diagram__layer--data">
            <div className="diagram__box diagram__box--dynamo">
              <span>🗄️</span>
              <label>DynamoDB</label>
              <small>Users, Households, Lists</small>
            </div>
            <div className="diagram__box diagram__box--s3-attach">
              <span>📎</span>
              <label>S3</label>
              <small>Attachments</small>
            </div>
          </div>
        </div>
      </div>

      <div className="info-cards">
        <div className="info-card">
          <h3>Serverless Architecture</h3>
          <p>No servers to manage. AWS handles scaling, patching, and availability. You pay only for what you use.</p>
          <ul>
            <li>Lambda scales from 0 to thousands of requests</li>
            <li>DynamoDB handles any amount of data</li>
            <li>CloudFront caches globally for fast access</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Infrastructure as Code</h3>
          <p>Every AWS resource is defined in Terraform. Nothing is clicked manually in the console.</p>
          <ul>
            <li>Version controlled in Git</li>
            <li>Reproducible environments</li>
            <li>Easy to review and audit changes</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>GitOps Deployment</h3>
          <p>Push to Git → Tests run → Infrastructure updates → App deploys. Fully automated.</p>
          <ul>
            <li>staging branch → Staging environment</li>
            <li>main branch → Production environment</li>
            <li>PRs run tests before merge</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface CodeSectionProps {
  expandedCode: string | null;
  setExpandedCode: (id: string | null) => void;
}

function AWSSection({ expandedCode, setExpandedCode }: CodeSectionProps) {
  const services = [
    {
      name: 'CloudFront',
      icon: '🌐',
      purpose: 'Content Delivery Network',
      why: 'Serves the React frontend from edge locations globally. Provides HTTPS, caching, and fast load times.',
      keyFeatures: ['Origin Access Control for S3', 'Custom error pages for SPA routing', 'Cache behaviors per file type'],
      pricing: 'First 1TB/month free, then ~$0.085/GB'
    },
    {
      name: 'S3',
      icon: '📦',
      purpose: 'Static File Storage',
      why: 'Stores the built React app (HTML, JS, CSS) and user attachments. Highly durable (99.999999999%).',
      keyFeatures: ['Private bucket with CloudFront access', 'Versioning for deployments', 'Lifecycle policies for cost'],
      pricing: 'First 5GB free, then ~$0.023/GB/month'
    },
    {
      name: 'API Gateway',
      icon: '🚪',
      purpose: 'HTTP API Gateway',
      why: 'Routes HTTP requests to Lambda. Handles CORS, rate limiting, and JWT validation.',
      keyFeatures: ['HTTP API (cheaper than REST)', 'JWT Authorizer with Cognito', 'Auto-deploy on changes'],
      pricing: 'First 1M requests/month free, then $1/million'
    },
    {
      name: 'Lambda',
      icon: '⚡',
      purpose: 'Serverless Compute',
      why: 'Runs the FastAPI backend. Scales automatically, no servers to manage.',
      keyFeatures: ['Python 3.11 runtime', 'Mangum adapter for ASGI', '512MB memory, 30s timeout'],
      pricing: 'First 1M requests/month free, then $0.20/million'
    },
    {
      name: 'DynamoDB',
      icon: '🗄️',
      purpose: 'NoSQL Database',
      why: 'Stores all app data. Single-digit millisecond latency, scales infinitely.',
      keyFeatures: ['On-demand capacity (pay per request)', 'GSI for email lookups', 'TTL for invite expiration'],
      pricing: 'First 25GB free, then ~$0.25/GB + $1.25/million writes'
    },
    {
      name: 'Cognito',
      icon: '🔑',
      purpose: 'User Authentication',
      why: 'Handles user signup, login, and OAuth with Google. Issues JWT tokens.',
      keyFeatures: ['Google OAuth integration', 'JWT token issuance', 'Password policies'],
      pricing: 'First 50,000 MAU free, then $0.0055/MAU'
    }
  ];

  return (
    <div className="section">
      <h2>☁️ AWS Services Used</h2>
      <p className="section-intro">
        This app uses 6 core AWS services, all within the free tier for small usage.
        Here's what each does and why we chose it.
      </p>

      <div className="service-grid">
        {services.map((service) => (
          <div key={service.name} className="service-card">
            <div className="service-card__header">
              <span className="service-card__icon">{service.icon}</span>
              <div>
                <h3>{service.name}</h3>
                <span className="service-card__purpose">{service.purpose}</span>
              </div>
            </div>
            <p className="service-card__why">{service.why}</p>
            <div className="service-card__features">
              <strong>Key Features:</strong>
              <ul>
                {service.keyFeatures.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div className="service-card__pricing">
              💰 {service.pricing}
            </div>
          </div>
        ))}
      </div>

      <div className="callout callout--tip">
        <strong>💡 Interview Tip:</strong> Be ready to explain why you chose each service.
        "We used API Gateway HTTP APIs instead of REST APIs because they're 70% cheaper
        and we didn't need the advanced features of REST APIs."
      </div>
    </div>
  );
}

function TerraformSection({ expandedCode, setExpandedCode }: CodeSectionProps) {
  return (
    <div className="section">
      <h2>🔧 Terraform Infrastructure as Code</h2>
      <p className="section-intro">
        All infrastructure is defined in Terraform files. This means every AWS resource
        can be version controlled, reviewed, and reproduced exactly.
      </p>

      <div className="file-structure">
        <h3>📁 Terraform File Structure</h3>
        <pre className="file-tree">{`terraform/
├── main.tf           # Provider, backend, S3 buckets
├── variables.tf      # Input variables
├── outputs.tf        # Output values (URLs, IDs)
├── cognito.tf        # User pool, OAuth, identity
├── lambda.tf         # Function, API Gateway, IAM
├── dynamodb.tf       # Tables and indexes
└── cloudfront.tf     # CDN distribution`}</pre>
      </div>

      <div className="concept-block">
        <h3>🔑 Key Terraform Concepts</h3>

        <div className="concept">
          <h4>1. State Management</h4>
          <p>Terraform tracks what resources exist in a "state file". We store it in S3 for team access:</p>
          <CodeBlock
            id="tf-backend"
            expanded={expandedCode === 'tf-backend'}
            onToggle={() => setExpandedCode(expandedCode === 'tf-backend' ? null : 'tf-backend')}
            code={`terraform {
  backend "s3" {
    bucket         = "simplenotes-terraform-state"
    key            = "terraform.tfstate"
    region         = "ca-central-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # Prevents concurrent modifications
  }
}`}
          />
        </div>

        <div className="concept">
          <h4>2. Workspaces for Environments</h4>
          <p>Same code, different environments. Workspaces keep staging and prod separate:</p>
          <CodeBlock
            id="tf-workspace"
            expanded={expandedCode === 'tf-workspace'}
            onToggle={() => setExpandedCode(expandedCode === 'tf-workspace' ? null : 'tf-workspace')}
            code={`# In CI/CD pipeline:
terraform workspace select staging || terraform workspace new staging

# Resources use workspace in names:
locals {
  prefix = "simplenotes-\${terraform.workspace}"
  # Results in: simplenotes-staging or simplenotes-prod
}`}
          />
        </div>

        <div className="concept">
          <h4>3. Resource Dependencies</h4>
          <p>Terraform automatically figures out what order to create things:</p>
          <CodeBlock
            id="tf-deps"
            expanded={expandedCode === 'tf-deps'}
            onToggle={() => setExpandedCode(expandedCode === 'tf-deps' ? null : 'tf-deps')}
            code={`# Lambda needs the IAM role to exist first
resource "aws_lambda_function" "api" {
  role = aws_iam_role.lambda_exec.arn  # Implicit dependency
  # Terraform creates the role before the function
}

# API Gateway needs CloudFront domain for CORS
cors_configuration {
  allow_origins = [
    "https://\${aws_cloudfront_distribution.frontend.domain_name}"
  ]
}`}
          />
        </div>

        <div className="concept">
          <h4>4. Variables and Outputs</h4>
          <p>Inputs come from variables, outputs are passed to CI/CD:</p>
          <CodeBlock
            id="tf-vars"
            expanded={expandedCode === 'tf-vars'}
            onToggle={() => setExpandedCode(expandedCode === 'tf-vars' ? null : 'tf-vars')}
            code={`# variables.tf - Inputs
variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true  # Won't show in logs
}

# outputs.tf - Outputs for CI/CD
output "frontend_url" {
  value = "https://\${aws_cloudfront_distribution.frontend.domain_name}"
}

output "api_gateway_url" {
  value = aws_apigatewayv2_api.main.api_endpoint
}`}
          />
        </div>
      </div>

      <div className="callout callout--warning">
        <strong>⚠️ Common Mistakes:</strong>
        <ul>
          <li>Forgetting to run <code>terraform init</code> after adding providers</li>
          <li>Not using <code>-out=tfplan</code> to save plans for apply</li>
          <li>Hardcoding values instead of using variables</li>
          <li>Not encrypting the state file in S3</li>
        </ul>
      </div>
    </div>
  );
}

function CICDSection({ expandedCode, setExpandedCode }: CodeSectionProps) {
  return (
    <div className="section">
      <h2>🚀 CI/CD Pipeline</h2>
      <p className="section-intro">
        GitHub Actions automates testing and deployment. Every push triggers the pipeline.
      </p>

      <div className="pipeline-diagram">
        <h3>Pipeline Flow</h3>
        <div className="pipeline">
          <div className="pipeline__stage">
            <div className="pipeline__trigger">
              <span>📝</span>
              <label>Push to Git</label>
            </div>
          </div>

          <div className="pipeline__arrow">→</div>

          <div className="pipeline__stage pipeline__stage--parallel">
            <div className="pipeline__job">
              <span>🐍</span>
              <label>Backend Tests</label>
              <small>pytest</small>
            </div>
            <div className="pipeline__job">
              <span>⚛️</span>
              <label>Frontend Build</label>
              <small>npm run build</small>
            </div>
          </div>

          <div className="pipeline__arrow">→</div>

          <div className="pipeline__stage">
            <div className="pipeline__job">
              <span>🔧</span>
              <label>Terraform Plan</label>
              <small>Preview changes</small>
            </div>
          </div>

          <div className="pipeline__arrow">→</div>

          <div className="pipeline__stage">
            <div className="pipeline__job">
              <span>🏗️</span>
              <label>Terraform Apply</label>
              <small>Create/update infra</small>
            </div>
          </div>

          <div className="pipeline__arrow">→</div>

          <div className="pipeline__stage">
            <div className="pipeline__job">
              <span>📤</span>
              <label>Deploy to S3</label>
              <small>Upload frontend</small>
            </div>
          </div>

          <div className="pipeline__arrow">→</div>

          <div className="pipeline__stage">
            <div className="pipeline__job">
              <span>🔄</span>
              <label>Invalidate Cache</label>
              <small>CloudFront</small>
            </div>
          </div>
        </div>
      </div>

      <div className="concept-block">
        <h3>📄 GitHub Actions Workflow</h3>

        <div className="concept">
          <h4>Workflow Triggers</h4>
          <CodeBlock
            id="gha-trigger"
            expanded={expandedCode === 'gha-trigger'}
            onToggle={() => setExpandedCode(expandedCode === 'gha-trigger' ? null : 'gha-trigger')}
            code={`name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]  # Deploy on push
  pull_request:
    branches: [main, staging]  # Test on PRs

env:
  AWS_REGION: ca-central-1
  TF_VERSION: "1.6.0"`}
          />
        </div>

        <div className="concept">
          <h4>Parallel Test Jobs</h4>
          <CodeBlock
            id="gha-tests"
            expanded={expandedCode === 'gha-tests'}
            onToggle={() => setExpandedCode(expandedCode === 'gha-tests' ? null : 'gha-tests')}
            code={`jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v --cov=app

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist`}
          />
        </div>

        <div className="concept">
          <h4>Deploy Job (needs tests to pass)</h4>
          <CodeBlock
            id="gha-deploy"
            expanded={expandedCode === 'gha-deploy'}
            onToggle={() => setExpandedCode(expandedCode === 'gha-deploy' ? null : 'gha-deploy')}
            code={`deploy-staging:
  needs: [test-backend, test-frontend]  # Wait for tests
  if: github.ref == 'refs/heads/staging'
  environment: staging  # GitHub environment with secrets

  steps:
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}

    - run: |
        terraform init
        terraform workspace select staging
        terraform plan -out=tfplan
        terraform apply -auto-approve tfplan

    - run: |
        aws s3 sync frontend/dist s3://\$BUCKET --delete
        aws cloudfront create-invalidation --distribution-id \$CF_ID --paths "/*"`}
          />
        </div>
      </div>

      <div className="info-cards">
        <div className="info-card">
          <h3>🔐 Secrets Management</h3>
          <p>Sensitive values are stored in GitHub Secrets and injected at runtime:</p>
          <ul>
            <li><code>AWS_ACCESS_KEY_ID</code></li>
            <li><code>AWS_SECRET_ACCESS_KEY</code></li>
            <li><code>GOOGLE_CLIENT_ID</code></li>
            <li><code>GOOGLE_CLIENT_SECRET</code></li>
          </ul>
        </div>

        <div className="info-card">
          <h3>📦 Artifacts</h3>
          <p>The frontend build is saved as an artifact and downloaded by the deploy job. This ensures the same build goes to all environments.</p>
        </div>
      </div>
    </div>
  );
}

function EnvironmentsSection() {
  return (
    <div className="section">
      <h2>🌍 Staging & Production Environments</h2>
      <p className="section-intro">
        Complete isolation between environments. Same code, different infrastructure.
      </p>

      <div className="env-comparison">
        <div className="env-card env-card--staging">
          <h3>🟡 Staging</h3>
          <div className="env-card__trigger">
            <strong>Trigger:</strong> Push to <code>staging</code> branch
          </div>
          <div className="env-card__resources">
            <strong>Resources:</strong>
            <ul>
              <li>simplenotes-staging-api (Lambda)</li>
              <li>simplenotes-staging-users (DynamoDB)</li>
              <li>simplenotes-staging-frontend (S3)</li>
              <li>Separate CloudFront distribution</li>
              <li>Separate Cognito user pool</li>
            </ul>
          </div>
          <div className="env-card__purpose">
            <strong>Purpose:</strong> Test new features, safe to break
          </div>
        </div>

        <div className="env-card env-card--prod">
          <h3>🟢 Production</h3>
          <div className="env-card__trigger">
            <strong>Trigger:</strong> Push to <code>main</code> branch
          </div>
          <div className="env-card__resources">
            <strong>Resources:</strong>
            <ul>
              <li>simplenotes-prod-api (Lambda)</li>
              <li>simplenotes-prod-users (DynamoDB)</li>
              <li>simplenotes-prod-frontend (S3)</li>
              <li>Separate CloudFront distribution</li>
              <li>Separate Cognito user pool</li>
            </ul>
          </div>
          <div className="env-card__purpose">
            <strong>Purpose:</strong> Real users, must be stable
          </div>
        </div>
      </div>

      <div className="workflow-diagram">
        <h3>Deployment Workflow</h3>
        <div className="workflow">
          <div className="workflow__step">
            <div className="workflow__box">Feature Branch</div>
            <small>Develop new feature</small>
          </div>
          <div className="workflow__arrow">→ PR →</div>
          <div className="workflow__step">
            <div className="workflow__box workflow__box--staging">staging</div>
            <small>Merge, auto-deploy</small>
          </div>
          <div className="workflow__arrow">→ Test → PR →</div>
          <div className="workflow__step">
            <div className="workflow__box workflow__box--prod">main</div>
            <small>Merge, auto-deploy</small>
          </div>
        </div>
      </div>

      <div className="callout callout--tip">
        <strong>💡 Best Practice:</strong> Never deploy directly to production.
        All changes go through staging first. Use GitHub branch protection rules
        to require PR reviews before merging to main.
      </div>
    </div>
  );
}

function SecuritySection({ expandedCode, setExpandedCode }: CodeSectionProps) {
  return (
    <div className="section">
      <h2>🔐 Security & IAM</h2>
      <p className="section-intro">
        Security is built into every layer: authentication, authorization, and least-privilege access.
      </p>

      <div className="security-layers">
        <div className="security-layer">
          <h3>1. User Authentication (Cognito)</h3>
          <ul>
            <li>Google OAuth for social login</li>
            <li>JWT tokens for API authentication</li>
            <li>Token refresh for long sessions</li>
            <li>Password policies enforced</li>
          </ul>
        </div>

        <div className="security-layer">
          <h3>2. API Authorization (API Gateway)</h3>
          <ul>
            <li>JWT Authorizer validates tokens before Lambda</li>
            <li>Public routes (health, docs) don't require auth</li>
            <li>Protected routes require valid JWT</li>
          </ul>
          <CodeBlock
            id="sec-jwt"
            expanded={expandedCode === 'sec-jwt'}
            onToggle={() => setExpandedCode(expandedCode === 'sec-jwt' ? null : 'sec-jwt')}
            code={`resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web.id]
    issuer   = "https://\${aws_cognito_user_pool.main.endpoint}"
  }
}`}
          />
        </div>

        <div className="security-layer">
          <h3>3. Least Privilege IAM</h3>
          <ul>
            <li>Lambda can only access specific DynamoDB tables</li>
            <li>S3 bucket is private, only CloudFront can read</li>
            <li>No wildcard permissions</li>
          </ul>
          <CodeBlock
            id="sec-iam"
            expanded={expandedCode === 'sec-iam'}
            onToggle={() => setExpandedCode(expandedCode === 'sec-iam' ? null : 'sec-iam')}
            code={`resource "aws_iam_role_policy" "lambda_exec" {
  policy = jsonencode({
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query"
          # Only specific actions, not dynamodb:*
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          # Only specific tables, not *
        ]
      }
    ]
  })
}`}
          />
        </div>

        <div className="security-layer">
          <h3>4. Data Security</h3>
          <ul>
            <li>HTTPS everywhere (CloudFront enforces)</li>
            <li>DynamoDB encryption at rest</li>
            <li>S3 bucket encryption</li>
            <li>Terraform state encrypted in S3</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CostsSection() {
  return (
    <div className="section">
      <h2>💰 Cost Optimization</h2>
      <p className="section-intro">
        This architecture is designed to stay within AWS Free Tier for small apps,
        then scale cost-effectively.
      </p>

      <div className="cost-table">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Free Tier</th>
              <th>After Free Tier</th>
              <th>Our Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Lambda</td>
              <td>1M requests/month</td>
              <td>$0.20/million</td>
              <td className="cost--free">Free ✓</td>
            </tr>
            <tr>
              <td>API Gateway</td>
              <td>1M requests/month</td>
              <td>$1.00/million</td>
              <td className="cost--free">Free ✓</td>
            </tr>
            <tr>
              <td>DynamoDB</td>
              <td>25GB storage</td>
              <td>$0.25/GB</td>
              <td className="cost--free">Free ✓</td>
            </tr>
            <tr>
              <td>S3</td>
              <td>5GB storage</td>
              <td>$0.023/GB</td>
              <td className="cost--free">Free ✓</td>
            </tr>
            <tr>
              <td>CloudFront</td>
              <td>1TB transfer/month</td>
              <td>$0.085/GB</td>
              <td className="cost--free">Free ✓</td>
            </tr>
            <tr>
              <td>Cognito</td>
              <td>50,000 MAU</td>
              <td>$0.0055/MAU</td>
              <td className="cost--free">Free ✓</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="info-cards">
        <div className="info-card">
          <h3>Cost-Saving Decisions</h3>
          <ul>
            <li><strong>HTTP API vs REST API:</strong> 70% cheaper</li>
            <li><strong>DynamoDB On-Demand:</strong> Pay per request, not provisioned capacity</li>
            <li><strong>Lambda 512MB:</strong> Good balance of cost and performance</li>
            <li><strong>CloudWatch 14-day retention:</strong> Reduced from default 30 days</li>
            <li><strong>Single region:</strong> No cross-region replication costs</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Estimated Monthly Cost</h3>
          <div className="cost-estimate">
            <div className="cost-estimate__row">
              <span>Small App (1K users)</span>
              <span className="cost--free">$0-5/month</span>
            </div>
            <div className="cost-estimate__row">
              <span>Medium App (10K users)</span>
              <span>$10-30/month</span>
            </div>
            <div className="cost-estimate__row">
              <span>Large App (100K users)</span>
              <span>$100-300/month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterviewSection() {
  const questions = [
    {
      q: "Explain your CI/CD pipeline.",
      a: "We use GitHub Actions with a GitOps approach. Pushing to staging or main triggers the pipeline. First, tests run in parallel (pytest for Python, npm build for frontend). If tests pass, Terraform plans and applies infrastructure changes, then deploys the frontend to S3 and invalidates the CloudFront cache."
    },
    {
      q: "How do you manage different environments?",
      a: "We use Terraform workspaces. The same Terraform code creates completely separate infrastructure for staging and prod. Resource names include the workspace (e.g., simplenotes-staging-api vs simplenotes-prod-api). GitHub Secrets are scoped to environments."
    },
    {
      q: "How do you handle secrets?",
      a: "Secrets like AWS credentials and OAuth keys are stored in GitHub Secrets and injected as environment variables during CI/CD. Terraform marks sensitive variables with `sensitive = true` to prevent logging. The state file is encrypted in S3."
    },
    {
      q: "Why serverless instead of containers?",
      a: "For this app's scale, serverless is more cost-effective (pay per request, not per hour). Lambda handles our traffic patterns well - it scales to zero when idle and handles spikes automatically. We'd consider ECS/Fargate for consistent high-traffic or long-running workloads."
    },
    {
      q: "How would you add monitoring?",
      a: "CloudWatch is already collecting Lambda logs and metrics. I'd add CloudWatch Alarms for error rates and latency, SNS notifications for alerts, and possibly X-Ray for distributed tracing. For a larger app, consider Datadog or New Relic."
    },
    {
      q: "What if you needed to add a database migration system?",
      a: "DynamoDB is schemaless so migrations are mostly application-level. For schema changes, I'd version the data format and handle migrations in Lambda code. For RDS, I'd use a tool like Alembic or Flyway, run as a separate Lambda or in the CI/CD pipeline before deploying the app."
    }
  ];

  return (
    <div className="section">
      <h2>💼 Interview Preparation</h2>
      <p className="section-intro">
        Common questions you might get about this infrastructure, with answers you can adapt.
      </p>

      <div className="qa-list">
        {questions.map((item, i) => (
          <div key={i} className="qa-item">
            <div className="qa-question">
              <span className="qa-number">Q{i + 1}</span>
              {item.q}
            </div>
            <div className="qa-answer">{item.a}</div>
          </div>
        ))}
      </div>

      <div className="callout callout--tip">
        <strong>💡 Pro Tips:</strong>
        <ul>
          <li>Always explain the "why" behind decisions, not just the "what"</li>
          <li>Mention trade-offs: "We chose X because Y, but the downside is Z"</li>
          <li>Reference real experience: "In this project, I encountered..."</li>
          <li>Show you understand costs and can optimize</li>
          <li>Demonstrate security awareness throughout</li>
        </ul>
      </div>

      <div className="resources">
        <h3>📚 Learning Resources</h3>
        <div className="resource-grid">
          <a href="https://learn.hashicorp.com/terraform" target="_blank" rel="noopener noreferrer" className="resource-link">
            Terraform Learn (Official)
          </a>
          <a href="https://docs.github.com/en/actions" target="_blank" rel="noopener noreferrer" className="resource-link">
            GitHub Actions Docs
          </a>
          <a href="https://aws.amazon.com/getting-started/hands-on/" target="_blank" rel="noopener noreferrer" className="resource-link">
            AWS Hands-On Labs
          </a>
          <a href="https://www.youtube.com/c/TechWorldwithNana" target="_blank" rel="noopener noreferrer" className="resource-link">
            TechWorld with Nana (YouTube)
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface CodeBlockProps {
  id: string;
  code: string;
  expanded: boolean;
  onToggle: () => void;
}

function CodeBlock({ id, code, expanded, onToggle }: CodeBlockProps) {
  return (
    <div className={`code-block ${expanded ? 'expanded' : ''}`}>
      <button className="code-block__toggle" onClick={onToggle}>
        {expanded ? '▼ Hide Code' : '▶ Show Code'}
      </button>
      {expanded && (
        <pre className="code-block__content">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
