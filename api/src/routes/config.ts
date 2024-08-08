import { DEFAULT_EMAIL, DIRECTUS_QUERY_LIMIT, GMAPS_WEB_APIKEY, IMAGE_SERVER, MATCHING_ENABLED, S3_IMAGES_SERVER_URL, SMS_ENABLED, SUPPORT_EMAIL } from '../config'
import S3 from '../services/s3'
import { BRoute } from '../types'

export const config = {
    images: {
        properties: {
            url: S3.getInstance("images").getServerUrl()+"/properties/",
            suffix: ".webp",
            thumbnailSuffix: "_thumbnail.webp",
            resizePx: 1200
        },
        users: {
            url: S3.getInstance("images").getServerUrl()+"/users/",
            suffix: ".webp",
            thumbnailSuffix: "_thumbnail.webp",
            resizePx: 800
        }
    },
    emails: {
        community: DEFAULT_EMAIL,
        support: SUPPORT_EMAIL
    },
    keys: {
        gmaps: GMAPS_WEB_APIKEY,
    },
    upload: {
        maxFileSizeMb: 100
    },
    query: {
        limit: DIRECTUS_QUERY_LIMIT
    },
    // maintenanceMessage: "Coming soon 🙌...",
    features: {
        chat: true,
        swapRequest: true,
        matching: MATCHING_ENABLED,
        sms: SMS_ENABLED,
    }
}

const route:BRoute = {
    get: async (request, response) => {
        response.status(200).send(config)
    }
}

export default route