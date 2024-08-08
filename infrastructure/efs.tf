resource "aws_security_group" "efs" {
  name   = "${local.prefix}-efs-sg"
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

resource "aws_efs_file_system" "efs1" {
  tags = {
    Name = "${local.prefix}-efs-fs"
  }
}

resource "aws_efs_mount_target" "mount1" {
  file_system_id = aws_efs_file_system.efs1.id
  subnet_id      = aws_subnet.public1.id
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_mount_target" "mount2" {
  file_system_id = aws_efs_file_system.efs1.id
  subnet_id      = aws_subnet.public2.id
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_access_point" "ap1" {
  file_system_id = aws_efs_file_system.efs1.id
  root_directory {
    path = "/db"
    # creation_info {
    #   # owner_gid   = 33 // www-data for php
    #   # owner_uid   = 33
    #   # permissions = 755
    # }
  }
  tags = {
    Name = "${local.prefix}-efs-ap1-db"
  }
}