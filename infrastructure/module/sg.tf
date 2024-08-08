# resource "aws_security_group" "ecs_sg" {
#     name   = "${var.prefix}-ecs-instances-sg"
#     vpc_id = local.vpc_id

#     ingress {
#         from_port       = 22
#         to_port         = 22
#         protocol        = "tcp"
#         cidr_blocks     = ["0.0.0.0/0"]
#     }

#     ingress {
#         from_port       = 80
#         to_port         = 80
#         protocol        = "tcp"
#         cidr_blocks     = ["0.0.0.0/0"]
#     }

#     ingress {
#         from_port       = 443
#         to_port         = 443
#         protocol        = "tcp"
#         cidr_blocks     = ["0.0.0.0/0"]
#     }

#     egress {
#         from_port       = 0
#         to_port         = 65535
#         protocol        = "tcp"
#         cidr_blocks     = ["0.0.0.0/0"]
#     }
# }

# resource "aws_security_group" "web" {
#     name   = "${var.prefix}-ecs-services-sg"
#     vpc_id = local.vpc_id

#     ingress {
#         protocol         = "tcp"
#         from_port        = 80
#         to_port          = 80
#         cidr_blocks      = ["${local.vpc_cidr}"]
#         ipv6_cidr_blocks = ["::/0"]
#     }

#     egress {
#         protocol         = "-1"
#         from_port        = 0
#         to_port          = 0
#         cidr_blocks      = ["0.0.0.0/0"]
#         ipv6_cidr_blocks = ["::/0"]
#     }
# }

# resource "aws_security_group" "alb" {
#   name   = "${var.prefix}-alb-sg"
#   vpc_id = local.vpc_id
 
#   ingress {
#    protocol         = "tcp"
#    from_port        = 80
#    to_port          = 80
#    cidr_blocks      = ["0.0.0.0/0"]
#    ipv6_cidr_blocks = ["::/0"]
#   }
 
#   ingress {
#    protocol         = "tcp"
#    from_port        = 443
#    to_port          = 443
#    cidr_blocks      = ["0.0.0.0/0"]
#    ipv6_cidr_blocks = ["::/0"]
#   }
 
#   egress {
#    protocol         = "-1"
#    from_port        = 0
#    to_port          = 0
#    cidr_blocks      = ["0.0.0.0/0"]
#    ipv6_cidr_blocks = ["::/0"]
#   }
# }

resource "aws_security_group" "efs" {
  name   = "${var.prefix}-efs-sg"
  vpc_id = aws_vpc.main.id
 
  ingress {
   protocol         = "tcp"
   from_port        = 2049
   to_port          = 2049
   cidr_blocks      = ["${aws_vpc.main.cidr_block}"]
   ipv6_cidr_blocks = ["::/0"]
  }
 
  egress {
   protocol         = "-1"
   from_port        = 0
   to_port          = 0
   cidr_blocks      = ["0.0.0.0/0"]
   ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "server" {
  name        = "${var.prefix}-server-sg"
  description = "Allow inbound traffic to server"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "SSH from outside"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

#   ingress {
#     description      = "ADMIN tool from vpc"
#     from_port        = 4444
#     to_port          = 4444
#     protocol         = "tcp"
#     cidr_blocks      = [local.vpc_cidr]
#   }

  ingress {
    description      = "CMS from vpc"
    from_port        = 8055
    to_port          = 8055
    protocol         = "tcp"
    cidr_blocks      = [aws_vpc.main.id]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${var.prefix}-server-sg"
  }
}