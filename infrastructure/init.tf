provider "aws" {
  region  = "eu-west-3"
  alias   = "eu"
}

# provider "htpasswd" {
# }

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

terraform {
  backend "s3" {
    bucket               = "kazaswap-tfstates-multiregion"
    key                  = "main.tfstate"
    region               = "eu-west-3"
    workspace_key_prefix = "envs"
  }

  # required_providers {
  #   htpasswd = {
  #     source = "loafoe/htpasswd"
  #     version = "1.0.4"
  #   }
  # }
}

locals {
  project = "kazaswap"
  env = terraform.workspace
  prefix = "${local.project}-${local.env}"
  ecr = {
    "api": "${local.project}-api",
    "cms": "${local.project}-cms"
  }
  ecr_url = "${data.aws_caller_identity.current.id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com"
}