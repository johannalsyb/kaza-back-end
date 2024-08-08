resource "aws_iam_role" "ec2_role" {
  name = "${local.prefix}-ec2-main-role"

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

resource "aws_iam_role_policy" "main_policy" {
  name   = "${local.prefix}-ec2-main-policy"
  role   = aws_iam_role.ec2_role.id
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::*"
      ]
    },
    {
      "Sid": "ECRAccess",
      "Action": [
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetAuthorizationToken"
      ],
      "Effect": "Allow",
      "Resource": [
        "*"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.prefix}-ec2-main-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "${local.prefix}-ec2-main-profile"
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

resource "aws_eip" "main" {
  count = local.env == "p" ? 1 : 0
  vpc = true
  tags = {
    Name = "${local.prefix}-main-eip"
  }
}

resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "main" {
  key_name   = "${local.prefix}-main-keypair"
  public_key = tls_private_key.main.public_key_openssh

  provisioner "local-exec" {
    command = "echo '${tls_private_key.main.private_key_pem}' > ./key_pairs/${local.prefix}-main-keypair.pem"
  }

  tags = {
    Name = "${local.prefix}-main-keypair"
  }
}

# variable "subnet" {
#     type = number
#     default = 0
# }

locals {
  subnet = 0
  main_privateip = "${trim(local.public1_cidr, ".0")}.10"
}

resource "aws_instance" "main" {
  ami = data.aws_ami.latest.id
  instance_type = local.env == "p" ? "t4g.small" : "t4g.small"
  associate_public_ip_address = true
  subnet_id = aws_subnet.public1.id
  key_name = aws_key_pair.main.key_name
  user_data = templatefile("${path.module}/templates/cms/startup.sh", {
    ECR_REPO_URL="${local.ecr_url}",
    S3_CONF_BUCKET="${aws_s3_bucket.conf.id}",
    NFS_ENDPOINT="${aws_efs_file_system.efs1.dns_name}",
  })

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.api.id, aws_security_group.cms.id]
  private_ip = local.main_privateip

#   network_interface {
#     network_interface_id = aws_network_interface.bastion.id
#     device_index         = 0
#   }

  root_block_device {
    volume_type = "gp3"
    volume_size = 20

    tags = {
      Name = "${local.prefix}-volume-main"
    }
  }

  tags = {
    Name = "${local.prefix}-main"
  }

  lifecycle {
    ignore_changes = [ami, associate_public_ip_address, user_data]
  }
}
resource "aws_eip_association" "eip_assoc_main" {
  count         = local.env == "p" ? 1 : 0
  instance_id   = aws_instance.main.id
  allocation_id = aws_eip.main[count.index].id
}
