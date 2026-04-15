terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state
  # backend "s3" {
  #   bucket         = "acme-tms-terraform-state"
  #   key            = "team-management/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ACME-TMS"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ─── VPC ──────────────────────────────────────────────
module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# ─── RDS PostgreSQL ──────────────────────────────────
module "rds" {
  source            = "./modules/rds"
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  db_instance_class = var.db_instance_class
}

# ─── Lambda + API Gateway ────────────────────────────
module "lambda_api" {
  source            = "./modules/lambda_api"
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_url            = module.rds.connection_url
  jwt_secret        = var.jwt_secret
}

# ─── S3 + CloudFront (Frontend) ──────────────────────
module "s3_cloudfront" {
  source      = "./modules/s3_cloudfront"
  environment = var.environment
  api_gateway_url = module.lambda_api.api_gateway_url
}
