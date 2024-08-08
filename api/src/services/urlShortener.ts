import { TINYURL_APIKEY } from "../config"
import { request } from "../utils"

const getUrl = async (url: string) => {
    return request("https://api.tinyurl.com/create",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TINYURL_APIKEY}`
        },
        body: JSON.stringify({
            url,
            "domain": "tinyurl.com",
            "description": "string"
        })
    })
    .then(r => r.json() as Promise<{
            "data": {
                "domain": string,
                "alias": string,
                "deleted": boolean,
                "archived": boolean,
                "analytics": {
                    "enabled": boolean,
                    "public": boolean
                },
                "created_at": "2023-11-21T16:00:44+00:00",
                "expires_at": null,
                "tiny_url": string,
                "url": string
            },
            "code": number,
            "errors": any[]
    }>)
    .then(r => r.data.tiny_url)
}

export default getUrl