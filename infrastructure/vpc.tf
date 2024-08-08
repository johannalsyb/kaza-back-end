locals {
  vpc_cidr = "10.0.0.0"
  public1_cidr = "10.0.1.0"
  public2_cidr = "10.0.2.0"
}

resource "aws_vpc" "main" {
  cidr_block = "${local.vpc_cidr}/16"
  enable_dns_hostnames = true
  enable_dns_support = true
  tags = {
    Name = "${local.prefix}-main-vpc"
  }
}

#######################################
## Public subnets
#######################################
resource "aws_subnet" "public1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "${local.public1_cidr}/24"
  availability_zone       = "${data.aws_region.current.name}a"

  tags = {
    Name = "${local.prefix}-main-public1"
  }
}

resource "aws_subnet" "public2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "${local.public2_cidr}/24"
  availability_zone       = "${data.aws_region.current.name}b"

  tags = {
    Name = "${local.prefix}-main-public2"
  }
}

#######################################
## Internet Gateway
#######################################
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
    tags = {
    Name = "${local.prefix}-main-igw"
  }
}

#######################################
## Route tables
#######################################
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.prefix}-main-public-route-table"
  }
}
 
resource "aws_route" "public" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}
 
resource "aws_route_table_association" "public1" {
  subnet_id      = aws_subnet.public1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public2" {
  subnet_id      = aws_subnet.public2.id
  route_table_id = aws_route_table.public.id
}