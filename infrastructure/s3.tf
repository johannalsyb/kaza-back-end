resource "aws_s3_bucket" "files" {
  bucket = "${local.prefix}-files"
}

resource "aws_s3_bucket_ownership_controls" "files" {
  bucket = aws_s3_bucket.files.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "files" {
  depends_on = [aws_s3_bucket_ownership_controls.files]

  bucket = aws_s3_bucket.files.id
  acl    = "private"
}

# resource "aws_s3_bucket_acl" "files" {
#   bucket = aws_s3_bucket.files.id
#   acl    = "private"
# }

resource "aws_s3_bucket" "conf" {
  bucket = "${local.prefix}-conf"
}

# resource "aws_s3_bucket_acl" "conf" {
#   bucket = aws_s3_bucket.conf.id
#   acl    = "private"
# }

variable "cms_port" {
  description = "CMS Port"
  type = number
  default = 8080
}

variable "redis_port" {
  description = "Redis Port"
  type = number
  default = 6379
}

variable "redis_gui_port" {
  description = "Redis Insights GUI Port"
  type = number
  default = 2052 // Allowed by CF DNS proxy https://developers.cloudflare.com/fundamentals/reference/network-ports/
}

variable "api_port" {
  description = "API Port"
  type = number
  default = 8880 // Allowed by CF DNS proxy https://developers.cloudflare.com/fundamentals/reference/network-ports/
}

locals {
  basic_auth = {
    "s":[{
      user: var.basic_auth_user_admin,
      password: bcrypt(var.basic_auth_password_admin_staging)
    },{
      user: var.basic_auth_user_frontend,
      password: bcrypt(var.basic_auth_password_frontend_staging)
    }]
    "p":[{
      user: var.basic_auth_user_admin,
      password: bcrypt(var.basic_auth_password_admin_prod)
    },{
      user: var.basic_auth_user_frontend,
      password: bcrypt(var.basic_auth_password_frontend_prod)
    }]
  }
  db_root_password = {
    "s": var.db_root_password_staging
    "p": var.db_root_password_prod
  }
  db_user = var.db_user
  db_password = {
    "s": var.db_password_staging
    "p": var.db_password_prod
  }
  cms_email = {
    "s": var.cms_email_staging
    "p": var.cms_email_prod
  }
  cms_password = {
    "s": var.cms_password_staging
    "p": var.cms_password_prod
  }
  cms_key = {
    "s": var.cms_key_staging
    "p": var.cms_key_prod
  }
  cms_secret = {
    "s": var.cms_secret_staging
    "p": var.cms_secret_prod
  }
  api_token = {
    "s": var.api_token_staging
    "p": var.api_token_prod
  }
  cors_origins = {
    "s": "*"
    "p": "*"
  }
  sms_enabled = {
    "s": false
    "p": true
  }
  sendgrid_apikey = {
    "s": var.sendgrid_apikey_staging
    "p": var.sendgrid_apikey_prod
  }
  brevo_apikey = {
    "s": var.brevo_apikey_staging
    "p": var.brevo_apikey_prod
  }
  ws_url = {
    "s": "wss://be-s.kazaswap.co/ws"
    "p": "wss://be-p.kazaswap.co/ws"
  }
  base_url = {
    "s": "https://staging.kazaswap.pages.dev"
    "p": "https://app.kazaswap.co"
  }
  gmaps_apikey=var.gmaps_apikey
  gmaps_web_apikey=var.gmaps_web_apikey
  tinyurl_apikey=var.tinyurl_apikey
  clicksend_username=var.clicksend_username
  clicksend_apikey=var.clicksend_apikey
}


resource "aws_s3_object" "docker-compose-cms" {
  bucket = aws_s3_bucket.conf.id
  key    = "cms/docker-compose.yaml"
  content = templatefile("./templates/cms/docker-compose.yaml", {
    KAZASWAP_CMS_IMAGE="${local.ecr_url}/${local.ecr["cms"]}:latest"
    DB_ROOT_PASSWORD="${local.db_root_password[local.env]}"
    DB_USER="${local.db_user}"
    DB_PASSWORD="${local.db_password[local.env]}"
    ADMIN_EMAIL="${local.cms_email[local.env]}"
    ADMIN_PASSWORD="${local.cms_password[local.env]}"
    ADMIN_DB_KEY="${local.cms_key[local.env]}"
    ADMIN_DB_SECRET="${local.cms_secret[local.env]}"
    CMS_PORT="${var.cms_port}"
  })
  etag = filemd5("./templates/cms/docker-compose.yaml")
}

resource "aws_s3_object" "api_htpasswd" {
  provider = aws.eu
  bucket  = aws_s3_bucket.conf.id
  key     = "api/htpasswd"
  content = templatefile("./templates/api/htpasswd", {
    basic_auth=local.basic_auth[local.env]
  })
  etag = filemd5("./templates/api/htpasswd")
}

resource "aws_s3_object" "api_nginx" {
  provider = aws.eu
  bucket  = aws_s3_bucket.conf.id
  key     = "api/nginx.conf"
  content = templatefile("./templates/api/nginx.conf", {
    REDIS_GUI_PORT = var.redis_gui_port
    API_PORT = var.api_port
  })
  etag = filemd5("./templates/api/nginx.conf")
}

resource "aws_s3_object" "api_env" {
  bucket = aws_s3_bucket.conf.id
  key    = "api/env"
  content = templatefile("./templates/api/env", {
    DIRECTUS_URL="http://localhost:${var.cms_port}"
    DIRECTUS_AUTH_BEARER="${local.api_token[local.env]}"
    SENDGRID_APIKEY="${local.sendgrid_apikey[local.env]}"
    BREVO_APIKEY="${local.brevo_apikey[local.env]}"
    REDIS_ARGS="" // TODO
    REDIS_PORT="${var.redis_port}"
    API_PORT="${var.api_port}"
    SERVER_IP="${aws_instance.main.public_ip}"
    CORS_ALLOWED_ORIGINS="${local.cors_origins[local.env]}"
    S3_REGION="${aws_s3_bucket.files.region}"
    S3_BUCKET="${aws_s3_bucket.files.bucket}"
    SMS_ENABLED="${local.sms_enabled[local.env]}"
    GMAPS_APIKEY="${local.gmaps_apikey}"
    GMAPS_WEB_APIKEY="${local.gmaps_web_apikey}"
    TINYURL_APIKEY="${local.tinyurl_apikey}"
    CLICKSEND_USERNAME="${local.clicksend_username}"
    CLICKSEND_APIKEY="${local.clicksend_apikey}"
    BUBBLE_TOKEN="${var.bubble_token}"
    API_BASE_URL="http://localhost:${var.api_port}"
    API_ADMIN_EMAIL="${var.api_admin_email}"
    API_ADMIN_PASSWORD="${var.api_admin_password}"
    BUBBLE_BASE_URL="https://app.kazaswap.co/version-test/api/1.1/obj/"
    S3_IMAGES_REGION="auto"
    S3_IMAGES_ENDPOINT="https://d734c2711d2f73954d1d472ac914134d.r2.cloudflarestorage.com"
    S3_IMAGES_ACCESS_KEY="${var.cloudflare_s3_access_key}"
    S3_IMAGES_SECRET_KEY="${var.cloudflare_s3_secret_key}"
    S3_IMAGES_BUCKET="kazaswap-assets"
    S3_IMAGES_PREFIX="${local.env}/images"
    S3_IMAGES_SERVER_URL="https://assets.kazaswap.co/"
    BASE_URL="${local.base_url[local.env]}"
    WS_URL="${local.ws_url[local.env]}"
    NEW_MESSAGE_NOTIFICATION_DELAY_MIN=30
    DAEMON_NOTIFICATION_CHECK_MIN=5
    DAEMON_INCOMPLETE_PROFILES_CHECK_HRS=24
  })
  etag = filemd5("./templates/api/env")
}

resource "aws_s3_object" "docker-compose-api" {
  bucket = aws_s3_bucket.conf.id
  key    = "api/docker-compose.yaml"
  content = templatefile("./templates/api/docker-compose.yaml", {
    KAZASWAP_API_IMAGE="${local.ecr_url}/${local.ecr["api"]}:latest"
    REDIS_ARGS="" // TODO
    REDIS_PORT="${var.redis_port}"
  })
  etag = filemd5("./templates/api/docker-compose.yaml")
}