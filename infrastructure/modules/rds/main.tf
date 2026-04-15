variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "db_name" { type = string }
variable "db_username" { type = string }
variable "db_password" { type = string }
variable "db_instance_class" { type = string }

resource "aws_db_subnet_group" "main" {
  name       = "tms-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = { Name = "tms-${var.environment}-db-subnet-group" }
}

resource "aws_security_group" "rds" {
  name_prefix = "tms-${var.environment}-rds-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "tms-${var.environment}-rds-sg" }
}

resource "aws_db_instance" "main" {
  identifier     = "tms-${var.environment}"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot = true
  multi_az            = false

  backup_retention_period = 7

  tags = { Name = "tms-${var.environment}-postgres" }
}

output "endpoint" { value = aws_db_instance.main.endpoint }
output "connection_url" {
  value     = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${var.db_name}"
  sensitive = true
}
