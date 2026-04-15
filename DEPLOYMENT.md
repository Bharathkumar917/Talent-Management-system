# Deployment Guide

## AWS Architecture

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    │   (CDN + HTTPS) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    S3 Bucket    │
                    │   (React SPA)   │
                    └─────────────────┘

    ┌─────────────────┐     ┌─────────────────┐
    │   API Gateway   │────▶│    Lambda        │
    │   (HTTP API)    │     │  (FastAPI app)   │
    └─────────────────┘     └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │   RDS Postgres   │
                            │   (Private VPC)  │
                            └─────────────────┘
```

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform 1.5+ installed
3. Node.js 18+ for building frontend

## Step 1: Configure Variables

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

**Required variables:**
```hcl
db_password = "your-secure-database-password"
jwt_secret  = "your-jwt-signing-secret"
```

## Step 2: Deploy Infrastructure

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

This creates:
- VPC with public/private subnets
- RDS PostgreSQL instance
- Lambda function + API Gateway
- S3 bucket + CloudFront distribution

## Step 3: Build and Deploy Backend

```bash
# Create Lambda deployment package
cd backend
pip install -r requirements.txt -t package/
cp -r app/ package/app/

# Create Mangum handler for Lambda
cat > package/mangum_handler.py << 'EOF'
from mangum import Mangum
from app.main import app
handler = Mangum(app)
EOF

pip install mangum -t package/

# Package
cd package
zip -r ../lambda_package.zip .
cd ..

# Upload to Lambda
aws lambda update-function-code \
  --function-name tms-production-api \
  --zip-file fileb://lambda_package.zip
```

## Step 4: Build and Deploy Frontend

```bash
cd frontend

# Set API URL to API Gateway endpoint
echo "VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com" > .env.production

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-frontend-bucket-name/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Step 5: Initialize Production Database

```bash
# Connect to RDS (via bastion or VPN)
# Run migrations
DATABASE_URL=postgresql://... python3 seed.py
```

## Environment Variables (Production)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret (min 32 chars) |
| `DEBUG` | `false` |
| `CORS_ORIGINS` | CloudFront URL |

## CI/CD Pipeline (Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest tests/ -v

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && pip install -r requirements.txt -t package/ && cp -r app/ package/
      - run: cd backend/package && zip -r ../lambda.zip .
      - run: aws lambda update-function-code --function-name tms-production-api --zip-file fileb://backend/lambda.zip

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd frontend && npm ci && npm run build
      - run: aws s3 sync frontend/dist/ s3://${{ secrets.S3_BUCKET }}/ --delete
```

## Teardown

```bash
cd infrastructure
terraform destroy
```
