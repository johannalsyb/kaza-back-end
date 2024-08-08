resource "aws_efs_file_system" "efs1" {
  tags = {
    Name = "${var.prefix}-efs-fs"
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
    Name = "${var.prefix}-efs-ap1-db"
  }
}

# resource "aws_efs_access_point" "pt-files" {
#   count = length(var.pt_instances)
#   file_system_id = aws_efs_file_system.pt.id
#   root_directory {
#     path = "/${var.pt_instances[count.index].name}/files"
#     creation_info {
#       owner_gid   = 33 // www-data for php
#       owner_uid   = 33
#       permissions = 755
#     }
#   }
#   tags = {
#     Name = "${var.prefix}-efs-ap-${var.pt_instances[count.index].name}-files"
#   }
# }