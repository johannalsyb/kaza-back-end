import Property from "../../../common/src/types/Property";
import { dal } from "../dal";
import redis from "../services/redis";
import { BRoute } from "../types";
import { formatFriendlyDate, getBase64String } from "../utils";
import {config} from "./config";
import fs from 'fs'

const route:BRoute = {
    routes: {
        "profile": {
            get: async (request, response) => {
                let {userId, thumbnail} = request.query
                if(!userId || !userId.length) return response.status(404).send({error: "Not found"})
                const u = await dal.get<{images: string, primaryImage:string}>(`/items/users/${userId}?fields=images,primaryImage`).catch(err => null)
                if(!u) return response.status(404).send({error: "Not found"})
                response.redirect(302, config.images.users.url+`${userId}/`+u.primaryImage+(thumbnail ? config.images.users.thumbnailSuffix : config.images.users.suffix))
            },
        },
        "card": {
            get: async (request, response) => {
                const {propertyId, force} = request.query
                if(!propertyId || !propertyId.length) return response.status(404).send({error: "Not found"})

                try {
                    let template:string
                    if(!force && await redis.exists(`marker:${propertyId}`)) {
                        const cached = await redis.get(`marker:${propertyId}`)
                        template = cached!.template
                    } else {
                        const property = await dal.get<Partial<Property>>(`/items/properties/${propertyId}?fields=images,owner,primaryImage`).catch(err => null)
                        if(!property) return response.status(404).send({error: "Not found (1)"})
                        if(!property.primaryImage) {
                            if(!property.images || !property.images.length) return response.status(404).send({error: "Not found (2)"})
                            property.primaryImage = property.images.split(",")[0]
                        }
                        const primaryImage = property.primaryImage
                        const userId = property.owner
                        const user = await dal.get<{
                            images: string,
                            primaryImage:string,
                            dateFrom: string,
                            dateTo: string,
                            swapLocations: string,
                        }>(`/items/users/${userId}?fields=images,primaryImage,dateFrom,dateTo,swapLocations`).catch(err => null)
                        if(!user) return response.status(404).send({error: "Not found (3)"})

                        const propertyBufferP = new Promise<ArrayBuffer | null>((res) => {
                            const url = `${config.images.properties.url}${propertyId}/${primaryImage}.webp`
                            console.log(url)
                            fetch(url)
                            .then(resp => {
                                if (!resp.ok) res(null)
                                res(resp.arrayBuffer())
                            })
                            .catch(err => {
                                res(null)
                            })
                        })
                        const avatarBufferP = new Promise<ArrayBuffer | null>((res) => {
                            if(!user) return res(null)
                            const userImage = user.primaryImage.split(",")[0]
                            const url = `${config.images.users.url}${userId}/${userImage}.webp`
                            console.log(url)
                            fetch(url)
                            .then(resp => {
                                if (!resp.ok) res(null)
                                res(resp.arrayBuffer())
                            })
                            .catch(err => {
                                res(null)
                            })
                        })

                        const [pBuffer, aBuffer] = await Promise.all([propertyBufferP, avatarBufferP])
                        
                        const mimeType = 'image/webp';
                        const propertyUrl = pBuffer ? `data:${mimeType};base64,${getBase64String(pBuffer)}` : null
                        const avatarUrl = aBuffer ? `data:${mimeType};base64,${getBase64String(aBuffer)}` : null
                        
                        const availableDateText = user?.dateFrom && user?.dateTo
                            ? `${formatFriendlyDate(new Date(user.dateFrom))} - ${formatFriendlyDate(new Date(user.dateTo))}`
                            : 'Flexible'; 
                        let locationText = (property.city ? property.city : property.region ? property.region : property.country) || "";
                        if (locationText.length > 25) {
                            locationText = locationText.substring(0, 23) + '...';
                        }

                        let swapForText = user?.swapLocations 
                            ? user.swapLocations.split("\n").map(s => s.split(",")[0]).join(", ")
                            : 'Flexible';

                        if (swapForText.length > 42) {
                            swapForText = swapForText.substring(0, 40) + '...';
                        }

                        template = await new Promise<string>((resolve, reject) => {
                            fs.readFile("assets/markerTemplate.svg", 'utf8', (err, data) => {
                                if (err) {
                                    console.error(err);
                                    return resolve("")
                                }
                                let str = data
                                    .replace('templateAvailableDate', availableDateText)
                                    .replace('templateLocation', locationText)
                                    .replace('templateSwapFor', swapForText)
                                if(propertyUrl)
                                    str = str.replace('%templatePropertyImage%', propertyUrl)
                                if(avatarUrl)
                                    str = str.replace('%templateAvatarImage%', avatarUrl)
                                resolve(str);
                            });
                        })
                        await redis.save(`marker:${propertyId}`, {template})
                    }
                    response.status(200).sendRaw(Buffer.from(template), "image/svg+xml")
                } catch (error) {
                    response.status(500).send({error})
                }
            }
        }
    }
}

export default route