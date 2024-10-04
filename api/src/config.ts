export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4004
export const LOGGING = process.env.LOGGING ? process.env.LOGGING === "true" : true
export const DEBUG = process.env.DEBUG ? process.env.DEBUG === "true" : true
export const WS_URL = process.env.WS_URL || `ws://localhost:${PORT}`
export const API = process.env.API ? process.env.API === "true" : true
export const DAEMON = process.env.DAEMON ? process.env.DAEMON === "true" : false
export const DAEMON_NOTIFICATION_CHECK_MIN = parseInt(process.env.DAEMON_NOTIFICATION_CHECK_MIN || "1") || 1
export const DAEMON_INCOMPLETE_PROFILES_CHECK_HRS = parseInt(process.env.DAEMON_INCOMPLETE_PROFILES_CHECK_HRS || "1") || 1
export const DAEMON_INCOMPLETE_PROFILES_NOTIFICATION_HRS = parseInt(process.env.DAEMON_INCOMPLETE_PROFILES_NOTIFICATION_HRS || "24") || 24
export const DAEMON_MATCHES_CHECK_HRS = parseInt(process.env.DAEMON_MATCHES_CHECK_HRS || "24") || 24

export const AUTH_HEADER = process.env.AUTH_HEADER || "X-KAZA-APIKEY"
export const AUTH_COOKIE = process.env.AUTH_COOKIE || "X-KAZA-AUTH"
export const AUTH_SKIP = process.env.AUTH_SKIP === "true"
export const AUTH_HEADER_REFRESH = process.env.AUTH_HEADER_REFRESH || "X-KAZA-REFRESH"

export const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(",") : ["*"]
export const CORS_ALLOWED_HEADERS = process.env.CORS_ALLOWED_HEADERS ? process.env.CORS_ALLOWED_HEADERS.split(",") : ["Content-Type", "Authorization", "customer", AUTH_HEADER, AUTH_COOKIE]
export const CORS_ALLOWED_METHODS = process.env.CORS_ALLOWED_METHODS ? process.env.CORS_ALLOWED_METHODS.split(",") : ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

export const BASE_URL = process.env.BASE_URL

export const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:7379/0"

export const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055"
export const DIRECTUS_AUTH_BEARER = process.env.DIRECTUS_AUTH_BEARER
export const DIRECTUS_QUERY_LIMIT = parseInt(process.env.DIRECTUS_QUERY_LIMIT || "50") || 50

export const SENDGRID_APIKEY = process.env.SENDGRID_APIKEY
export const BREVO_APIKEY = process.env.BREVO_APIKEY
export const DEFAULT_EMAIL = process.env.DEFAULT_EMAIL || "community@kazaswap.co"
export const DEFAULT_EMAIL_NAME = process.env.DEFAULT_EMAIL_NAME || "Kaza Swap"
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@kazaswap.co"

export const S3_REGION = process.env.S3_REGION || "eu-west-1"
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY
export const S3_ENDPOINT = process.env.S3_ENDPOINT
export const S3_BUCKET = process.env.S3_BUCKET || "kazaswap-files-dev"
export const S3_SERVER_URL = process.env.S3_SERVER_URL

export const S3_IMAGES_REGION = process.env.S3_IMAGES_REGION || S3_REGION
export const S3_IMAGES_BUCKET = process.env.S3_IMAGES_BUCKET || S3_BUCKET
export const S3_IMAGES_PREFIX = process.env.S3_IMAGES_PREFIX || "images"
export const S3_IMAGES_ENDPOINT = process.env.S3_IMAGES_ENDPOINT || S3_ENDPOINT
export const S3_IMAGES_ACCESS_KEY = process.env.S3_IMAGES_ACCESS_KEY || S3_ACCESS_KEY
export const S3_IMAGES_SECRET_KEY = process.env.S3_IMAGES_SECRET_KEY || S3_SECRET_KEY
export const S3_IMAGES_SERVER_URL = process.env.S3_IMAGES_SERVER_URL || S3_SERVER_URL

export const S3_CHATS_REGION = process.env.S3_CHATS_REGION || S3_REGION
export const S3_CHATS_BUCKET = process.env.S3_CHATS_BUCKET || S3_BUCKET
export const S3_CHATS_PREFIX = process.env.S3_CHATS_PREFIX || "chats"
export const S3_CHATS_ENDPOINT = process.env.S3_CHATS_ENDPOINT || S3_ENDPOINT
export const S3_CHATS_ACCESS_KEY = process.env.S3_CHATS_ACCESS_KEY || S3_ACCESS_KEY
export const S3_CHATS_SECRET_KEY = process.env.S3_CHATS_SECRET_KEY || S3_SECRET_KEY
export const S3_CHATS_SERVER_URL = process.env.S3_CHATS_SERVER_URL || S3_SERVER_URL

export const S3_NOTIFICATIONS_REGION = process.env.S3_NOTIFICATIONS_REGION || S3_REGION
export const S3_NOTIFICATIONS_BUCKET = process.env.S3_NOTIFICATIONS_BUCKET || S3_BUCKET
export const S3_NOTIFICATIONS_PREFIX = process.env.S3_NOTIFICATIONS_PREFIX || "notifications"
export const S3_NOTIFICATIONS_ENDPOINT = process.env.S3_NOTIFICATIONS_ENDPOINT || S3_ENDPOINT
export const S3_NOTIFICATIONS_ACCESS_KEY = process.env.S3_NOTIFICATIONS_ACCESS_KEY || S3_ACCESS_KEY
export const S3_NOTIFICATIONS_SECRET_KEY = process.env.S3_NOTIFICATIONS_SECRET_KEY || S3_SECRET_KEY
export const S3_NOTIFICATIONS_SERVER_URL = process.env.S3_NOTIFICATIONS_SERVER_URL || S3_SERVER_URL

export const IMAGE_SERVER = process.env.IMAGE_SERVER || (process.env.S3_IMAGES_SERVER_URL || `https://${S3_IMAGES_BUCKET}.s3-${S3_REGION}.amazonaws.com/${S3_IMAGES_PREFIX}`)
export const IMAGE_PROPERTY_WIDTH = parseInt(process.env.IMAGE_PROPERTY_WIDTH || "1200") || 1200
export const IMAGE_PROPERTY_THUMBNAIL_WIDTH = parseInt(process.env.IMAGE_PROPERTY_THUMBNAIL_WIDTH || "300") || 300
export const IMAGE_USER_WIDTH = parseInt(process.env.IMAGE_USER_WIDTH || "500") || 500
export const IMAGE_USER_THUMBNAIL_WIDTH = parseInt(process.env.IMAGE_USER_THUMBNAIL_WIDTH || "200") || 200

export const SMS_ENABLED = process.env.SMS_ENABLED ? process.env.SMS_ENABLED === "true" : false

export const GMAPS_APIKEY = process.env.GMAPS_APIKEY || "AIzaSyAElByd9h_IdbJdG4GpBDwQo0lV2LNB6jA"
export const GMAPS_WEB_APIKEY = process.env.GMAPS_WEB_APIKEY || "AIzaSyAElByd9h_IdbJdG4GpBDwQo0lV2LNB6jA"
export const TINYURL_APIKEY = process.env.TINYURL_APIKEY
export const SMSAPI_APIKEY = process.env.SMSAPI_APIKEY
export const CLICKSEND_USERNAME = process.env.CLICKSEND_USERNAME
export const CLICKSEND_APIKEY = process.env.CLICKSEND_APIKEY

export const NEW_MESSAGE_NOTIFICATION_DELAY_MIN = parseInt(process.env.NEW_MESSAGE_NOTIFICATION_DELAY_MIN || "1") || 1

export const MATCHING_ENABLED = process.env.MATCHING_ENABLED === "true" || false
export const MATCH_DAYS_THRESHOLD = parseInt(process.env.MATCH_DAYS_THRESHOLD || "30") || 30

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_51NtCJjCdvZbuHRnNLSFbzvGh1LYAPHd3NEyzY9qakeNRf7JMcrPKwNRtQ0cTPhcoFLr22AOdkhi44b2bhXfhhDwj007ZAD0qUz"
