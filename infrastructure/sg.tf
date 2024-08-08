resource "aws_security_group" "api" {
  name        = "${local.prefix}-api-sg"
  description = "Inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "SSH from outside"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "REDIS WEB from outside"
    from_port        = var.redis_gui_port
    to_port          = var.redis_gui_port
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "API from outside"
    from_port        = var.api_port
    to_port          = var.api_port
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "API Proxy from outside"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

#   ingress {
#     description      = "REDIS from vpc and whitelisted IPs"
#     from_port        = var.redis_port
#     to_port          = var.redis_port
#     protocol         = "tcp"
#     cidr_blocks      = concat(["${local.vpc_cidr}/16"], [for ip in var.whitelist: "${ip}/32"])
#   }

  # ingress {
  #   description      = "REDIS from whitelisted IPs"
  #   from_port        = var.redis-gui-port
  #   to_port          = var.redis-gui-port
  #   protocol         = "tcp"
  #   cidr_blocks      = [for ip in var.whitelist: "${ip}/32"]
  # }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${local.prefix}-api-sg"
  }
}

resource "aws_security_group" "cms" {
  name        = "${local.prefix}-cms-sg"
  description = "Inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "CMS from outside"
    from_port        = var.cms_port
    to_port          = var.cms_port
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${local.prefix}-cms-sg"
  }
}