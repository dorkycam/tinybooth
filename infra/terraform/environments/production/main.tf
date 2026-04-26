terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  # TODO: uncomment after Camrynn provides AWS account ID + state bucket name.
  # backend "s3" {
  #   bucket         = "tinybooth-tfstate-production"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-west-2"
  #   dynamodb_table = "tinybooth-tfstate-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "tinybooth"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region for production resources."
  type        = string
  default     = "us-west-2"
}
