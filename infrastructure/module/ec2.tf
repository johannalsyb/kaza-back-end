resource "aws_iam_role" "ec2_role" {
  name = "${var.prefix}-ec2Role"

  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Principal": {
               "Service": "ec2.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }
    ]
}
EOF
}

resource "aws_iam_role_policy" "ecr_ro_policy" {
  name   = "${var.prefix}_ecr_ro_policy"
  role   = aws_iam_role.ec2_role.id
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Action": [
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetAuthorizationToken"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

# resource "aws_iam_role_policy" "s3_policy" {
#   name   = "${var.prefix}_s3_policy"
#   role   = aws_iam_role.ec2_role.id
#   policy = <<EOF
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     {
#       "Sid": "",
#       "Action": [
#         "s3:PutObject",
#         "s3:GetObject",
#         "s3:GetBucketLocation",
#         "s3:ListBucket"
#       ],
#       "Effect": "Allow",
#       "Resource": [
#         "arn:aws:s3:::*"
#       ]
#     }
#   ]
# }
# EOF
# }

# resource "aws_iam_role_policy" "ecs_policy" {
#   name   = "${var.prefix}_ecs_policy"
#   role   = aws_iam_role.ec2_role.id
#   policy = <<EOF
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     {
#       "Sid": "",
#       "Action": [
#         "ecs:UpdateService"
#       ],
#       "Effect": "Allow",
#       "Resource": "*"
#     }
#   ]
# }
# EOF
# }

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "${var.prefix}-ec2-profile"
  }
}

data "aws_ami" "latest" {
#   executable_users = ["self"]
  most_recent      = true
#   name_regex       = "^Amazon Linux 2 LTS*"
  owners           = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-kernel-5.10-hvm-*"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

# resource "aws_network_interface" "bastion" {
#   subnet_id   = local.public_subnets_ids[0]
# #   private_ips = [var.bastion_privateip]
#   security_groups = [aws_security_group.bastion.id]

#   tags = {
#     Name = "${var.prefix}-ni-bastion"
#   }
# }

resource "tls_private_key" "server" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "server" {
  key_name   = "${var.prefix}-server-keypair"
  public_key = tls_private_key.server.public_key_openssh

  provisioner "local-exec" {
    command = "echo '${tls_private_key.server.private_key_pem}' > ./key_pairs/${var.prefix}-server-keypair.pem"
  }

  tags = {
    Name = "${var.prefix}-server-keypair"
  }
}

resource "aws_instance" "server" {
  ami = data.aws_ami.latest.id
  instance_type = "t4g.small"
  subnet_id = aws_subnet.public1.id
  key_name = aws_key_pair.server.key_name
  user_data = templatefile("${path.module}/templates/server.tftpl", 
    {
      NFS_ENDPOINT="${aws_efs_file_system.efs1.dns_name}"
      S3_FILES_BUCKET="${var.s3_files_bucket}"
    }
  )

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  network_interface {
    network_interface_id = aws_network_interface.server.id
    device_index         = 0
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 8

    tags = {
      Name = "${var.prefix}-volume-server"
    }
  }

  tags = {
    Name = "${var.prefix}-server"
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

resource "aws_eip" "server" {
  tags = {
    Name = "${var.prefix}-server-eip"
  }
}

resource "aws_eip_association" "eip_assoc_server" {
  instance_id   = aws_instance.server.id
  allocation_id = aws_eip.server.id
}

resource "aws_network_interface_sg_attachment" "sg_attachment" {
  security_group_id    = aws_security_group.server.id
  network_interface_id = aws_instance.server.primary_network_interface_id
}
