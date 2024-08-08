# data "aws_vpc" "default" {
#   default = true
# }

# data "aws_subnets" "subnets" {
#   filter {
#     name   = "vpc-id"
#     values = [local.vpc_id]
#   }
# }

# data "aws_subnet" "subnet" {
#   for_each = toset(data.aws_subnets.subnets.ids)
#   id       = each.value
# }

# locals {
#   vpc_id = data.aws_vpc.default.id
#   vpc_cidr = data.aws_vpc.default.cidr_block
#   public_subnets_ids = tolist(data.aws_subnets.subnets.ids)
#   public_subnets_cidr = [for s in data.aws_subnet.subnet : s.cidr_block]
# }

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
    tags = {
    Name = "${var.project}-${var.region}-vpc"
  }
}

#######################################
## Public subnets
#######################################
resource "aws_subnet" "public1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.region}a"

  tags = {
    Name = "${var.project}-public-subnet-1"
  }
}

resource "aws_subnet" "public2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.project}b"

  tags = {
    Name = "${var.project}-public-subnet-2"
  }
}