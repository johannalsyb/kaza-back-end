// Basic auth

variable basic_auth_user_admin {
    description = "Basic Auth User - ADMIN"
    type = string
}

variable basic_auth_password_admin_staging {
    description = "Basic Auth Password - ADMIN"
    type = string
}

variable basic_auth_password_admin_prod {
    description = "Basic Auth Password - ADMIN"
    type = string
}

variable basic_auth_user_frontend {
    description = "Basic Auth User - frontend"
    type = string
}

variable basic_auth_password_frontend_staging {
    description = "Basic Auth Password - frontend"
    type = string
}

variable basic_auth_password_frontend_prod {
    description = "Basic Auth Password - frontend"
    type = string
}

// Database MariaDB

variable db_user {
    description = "DB User"
    type = string
}

variable db_root_password_staging {
    description = "DB Password"
    type = string
}

variable db_root_password_prod {
    description = "DB Password"
    type = string
}

variable db_password_staging {
    description = "DB Password"
    type = string
}

variable db_password_prod {
    description = "DB Password"
    type = string
}

// CMS / Directus

variable cms_email_staging {
    description = "CMS Email"
    type = string
}

variable cms_email_prod {
    description = "CMS Email"
    type = string
}

variable cms_password_staging {
    description = "CMS Password"
    type = string
}

variable cms_password_prod {
    description = "CMS Password"
    type = string
}

variable cms_key_staging {
    description = "CMS  Key"
    type = string
}

variable cms_key_prod {
    description = "CMS  Key"
    type = string
}

variable cms_secret_staging {
    description = "CMS Secret"
    type = string
}

variable cms_secret_prod {
    description = "CMS Secret"
    type = string
}

// API

variable api_token_staging {
    description = "API token for Directus"
    type = string
}

variable api_token_prod {
    description = "API token for Directus"
    type = string
}

// CLICKSEND (SMS)

variable clicksend_username {
    description = "Clicksend Username"
    type = string
}

variable clicksend_apikey {
    description = "Clicksend APIKEY"
    type = string
}

// EMAILS (SENDGRID, BREVO)

variable sendgrid_apikey_staging {
    description = "Sendgrid API Key"
    type = string
}

variable sendgrid_apikey_prod {
    description = "Sendgrid API Key"
    type = string
}

variable brevo_apikey_staging {
    description = "Brevo API Key"
    type = string
}

variable brevo_apikey_prod {
    description = "Brevo API Key"
    type = string
}

// GOOGLE MAPS

variable gmaps_apikey {
    description = "Google Maps API Key"
    type = string
}

variable gmaps_web_apikey {
    description = "Google Maps Web API Key"
    type = string
}

// TINY URL

variable tinyurl_apikey {
    description = "Tiny URL API Key"
    type = string
}

// Bubble

variable bubble_token {
    description = "Bubble Token"
    type = string
}

variable api_admin_email {
    description = "Kazaswap admin email"
    type = string
}

variable api_admin_password {
    description = "Kazaswap admin password"
    type = string
}

// Cloudflare R2

variable cloudflare_s3_access_key {
    description = "Cloudflare S3 (R2) Access Key"
    type = string
}

variable cloudflare_s3_secret_key {
    description = "Cloudflare S3 (R2) Secret"
    type = string
}