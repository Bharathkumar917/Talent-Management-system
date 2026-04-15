output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.lambda_api.api_gateway_url
}

output "cloudfront_url" {
  description = "CloudFront distribution URL (frontend)"
  value       = module.s3_cloudfront.cloudfront_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.endpoint
}

output "s3_bucket" {
  description = "S3 bucket for frontend assets"
  value       = module.s3_cloudfront.bucket_name
}
