provider "aws" {
  region  = "eu-west-3"
  alias   = "eu"
}

data "aws_region" "current" {}

terraform {
  backend "s3" {
    bucket               = "kazaswap-tfstates-multiregion"
    key                  = "shared.tfstate"
    region               = "eu-west-3"
  }
}

locals {
  project = "kazaswap"
  prefix = local.project
  # region = "eu-west-3"
  # prefixes = {
  #   "eu-west-3" = "${local.prefix}-eu"
  # }
  # domains = [var.co_uk_domain_name, var.net_domain_name]
}