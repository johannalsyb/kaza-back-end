resource "aws_cloudwatch_log_group" "grp-api" {
  name = "${var.prefix}-api"
  retention_in_days = 7

  tags = {
    Name = "${var.prefix}-api"
  }
}

resource "aws_cloudwatch_log_group" "grp-db" {
  name = "${var.prefix}-db"
  retention_in_days = 7

  tags = {
    Name = "${var.prefix}-db"
  }
}

resource "aws_cloudwatch_log_group" "grp-cms" {
  name = "${var.prefix}-cms"
  retention_in_days = 7

  tags = {
    Name = "${var.prefix}-cms"
  }
}