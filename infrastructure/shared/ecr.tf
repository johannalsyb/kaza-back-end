locals {
  ecr_policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "keep last 10 images"
      action       = {
        type = "expire"
      }
      selection     = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 20
      }
    }]
  })
}

resource "aws_ecr_repository" "api" {
  name                 = "${local.project}-api"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy = local.ecr_policy
}

resource "aws_ecr_repository" "cms" {
  name                 = "${local.project}-cms"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_lifecycle_policy" "cms" {
  repository = aws_ecr_repository.cms.name
  policy = local.ecr_policy
}