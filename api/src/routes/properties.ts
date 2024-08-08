import type Property from '../../../common/src/types/Property'
import { dal } from '../dal'
import { BRoute } from '../types'
import auth from '../middlewares/auth'
import User from '../../../common/src/types/User'
import s3 from '../services/s3'
import { DIRECTUS_QUERY_LIMIT, IMAGE_SERVER, S3_IMAGES_BUCKET, S3_IMAGES_PREFIX } from '../config'
import gmaps, { Gmaps } from '../services/gmaps'
import { PublicProperty } from '../../../common/src/types/Property'
import { rotatePicture, uploadPictures } from '../models/property'
import { addressLookup, autocomplete, zoneLookup } from '../utils/location'
import { PrivateProperty } from '../../../common/src/types/api/properties'
import redis, { find } from '../services/redis'

const findProperty = async (id:string, user?:User) => {
    if(!user) return null
    const prop = await dal.get<Property>(`/items/properties/${id}`)
    .catch(err => {
        return null
    })
    if(!prop) return null
    
    if(prop.private) {
        if(user.role.includes("admin"))   return prop
        else if(prop.owner === user.id)   return prop
        return null
    } else return prop
}

const getProperties = async (filter:any[], privateFields = false) => {
    const qso:any = {
        "filter": JSON.stringify({"_and": filter}),
        "fields[]": publicPropertyFields.filter(s => !!s).join(","),
    }

    if(privateFields) qso["fields[]"] = [qso["fields[]"], ...privatePropertyFields].join(",")

    const url = `/items/properties?${new URLSearchParams(qso).toString()}`
    return (await dal.find<PublicProperty | PrivateProperty>(url) || [])
}

export const publicPropertyFields = [
    "id",
    "name",
    "amenities",
    "attractiveness",
    "images",
    "description",
    "flatmates",
    "country",
    "region",
    "city",
    "approxLat",
    "approxLon",
    "bathrooms",
    "bedrooms",
    "beds",
    "pets",
    "sizeM2",
    "type",
    "primaryImage",
    "smokingAllowed",
    "childrenAllowed",
    "bedArrangements",
]

export const privatePropertyFields = [
    "address",
    "lat",
    "lon",
    "private",
    "verified"
]

export const publicPropertyOwnerFields = [
    "owner.id",
    "owner.firstName",
    "owner.image",
    "owner.about",
    "owner.job",
    "owner.hobby",
    "owner.about",
    "owner.socialMedia",
    "owner.gender",
    "owner.primaryImage",
    "owner.swapLocations",
    "owner.dateFrom",
    "owner.dateTo",
]

export const publicPropertyWithOwnerFields = publicPropertyFields.concat(publicPropertyOwnerFields)

const route:BRoute = {
    get: async (request, response) => {
        const {filter, page, search} = request.query
        const json = filter ? JSON.parse(filter as string) : []
        let ffilter = !json.isArray ? json : []
        ffilter.push({private: {"_eq": false}})
        ffilter.push({verified: {"_eq": true}})
        if(search) {
            if(!search || search.length < 3) return response.status(400).send({error: "Minimum 3 characters"})
            const zone = await zoneLookup(search)
            if(!zone) return response.status(400).send({error: "Invalid search zone"})
            ffilter.push({"lat": {"_gte": zone.boundaries.low.lat, "_lte": zone.boundaries.high.lat}})
            ffilter.push({"lon": {"_gte": zone.boundaries.low.lon, "_lte": zone.boundaries.high.lon}})
            /* Note: These three filters only work for newly created properties. Imported ones from Bubble have
            not got proper country, region, city values... Commenting out for now... Until I don't know when !*/
            // ffilter.push({country: {"_eq": zone.country}})
            // if(zone.region) ffilter.push({region: {"_eq": zone.region}})
            // if(zone.city) ffilter.push({city: {"_eq": zone.city}})
        }
        const qso:any = {
            "filter": JSON.stringify({"_and": ffilter}),
            "fields[]": publicPropertyWithOwnerFields.join(","),
            "sort": "-createdDate,-attractiveness,-createdAt"
        }
        if(page) qso["page"] = page
        const url = `/items/properties?${new URLSearchParams(qso).toString()}`
        const properties = (await dal.find<PublicProperty>(url, {
            limit: DIRECTUS_QUERY_LIMIT,
            page: page ? parseInt(page as string) : 1
        }) || [])
        response.status(200).send(properties)
    },
    post: [async (request, response) => {
        const {address} = request.body
        if(!address || !address.length) return response.status(400).send({error: "No address"})
        const fullAddress = await addressLookup(address)
        if(!fullAddress) return response.status(406).send({error: "Invalid address"})
        const approx = await gmaps.approximateCoordinates(fullAddress.lat, fullAddress.lon)

        const {verified} = await dal.get<Partial<User>>(`/items/users/${request.user!.id}?fields[]=verified`)

        const property:Property = {
            ...request.body as Property,
            country: fullAddress.country,
            region: fullAddress.region || null,
            city: fullAddress.city,
            lat: fullAddress.lat,
            lon: fullAddress.lon,
            approxLat: approx.lat,
            approxLon: approx.lon,
            owner: request.user!.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            verified: false,
            private: !verified
        }
        property.images = ""

        const prop = await dal.create<Property>(`/items/properties`, property)

        let imgs = []
        if(Array.isArray(request.body.images) && request.body.images.length) {
            imgs = await uploadPictures(prop, request.body.images)   
            prop.images = imgs.join(",")
        }

        response.status(200).send(prop)
    }, [auth]],
    routes: {
        ":propertyId": {
            get: async (request, response) => {
                const {propertyId} = request.params
                const property = await dal.get<PublicProperty>(`/items/properties/${propertyId}?fields=[]${publicPropertyWithOwnerFields.join(",")}`)
                .catch(err => null)
                if(!property) return response.status(404).send({error: "Not found"})
                response.status(200).send(property)
            },
            patch: [async (request, response) => {
                const {propertyId} = request.params
                const property = await findProperty(propertyId, request.user)
                if(!property) return response.status(404).send({error: "Not found"})
                const {body} = request as {body: Partial<Property>}
                const forbiddenKeys:(keyof Property)[] = [
                    "id", "owner", "verified","lat","lon","approxLat","approxLon", "createdAt", "updatedAt",
                    "city", "country", "region"
                ]
                forbiddenKeys.forEach(k => {
                    delete body[k]
                })

                const nproperty:Property = {
                    ...property,
                    ...body,
                    updatedAt: new Date().toISOString()
                }

                if(body.address && body.address !== property.address) {
                    const fullAddress = await addressLookup(body.address)
                    if(!fullAddress) return response.status(406).send({error: "Invalid address"})
                    const approx = await gmaps.approximateCoordinates(fullAddress.lat, fullAddress.lon)

                    nproperty.address = body.address
                    nproperty.country = fullAddress.country
                    nproperty.region = fullAddress.region || null
                    nproperty.city = fullAddress.city
                    nproperty.lat = fullAddress.lat
                    nproperty.lon = fullAddress.lon
                    nproperty.approxLat = approx.lat
                    nproperty.approxLon = approx.lon
                }

                let imgs = []
                if(Array.isArray(body.images) && body.images.length) {
                    imgs = await uploadPictures(property, body.images, false)
                    nproperty.images = (property.images && property.images.length ? [...imgs, property.images] : imgs).join(",")
                }

                if(body.primaryImage) {
                    const nn = (nproperty.images || property.images).split(",").filter(i => i !== body.primaryImage)
                    nn.unshift(body.primaryImage)
                    nproperty.images = nn.join(",")
                }

                await redis.remove(`marker:${propertyId}`)

                const updated = await dal.update<Property>(`/items/properties/${propertyId}`, nproperty)
                response.status(200).send(updated)
            }, [auth]],
            routes: {
                "pictures": {
                    post: async (request, response) => {
                        const {propertyId} = request.params
                        const property = await findProperty(propertyId, request.user)
                        if(!property) return response.status(404).send({error: "Not found"})
                        if(!request.body.files || !request.body.files.length) return response.status(400).send({error: "No files"})
                        const files = request.body.files as string[]
                        const images = await uploadPictures(property, files)
                        response.status(200).send({images})
                    },
                    routes: {
                        ":imageId": {
                            delete: async (request, response) => {
                                const {propertyId, imageId} = request.params
                                const property = await findProperty(propertyId, request.user)
                                if(!property) return response.status(404).send({error: "Not found (1)"})
                                const iimage = (property.images as string).split(",").find(i => i === imageId)
                                if(!iimage) return response.status(404).send({error: "Not found (2)"})
                                const images = await s3.getInstance("images").ls(S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/properties/${property.id}/${imageId}`)
                                if(images.length) {
                                    await Promise.all(images.map(i => s3.getInstance("images").del(S3_IMAGES_BUCKET, i).catch(err => {})))
                                }
                                const iimages = (property.images as string).split(",").filter(i => i !== imageId) 
                                const updated = await dal.update<Property>(`/items/properties/${propertyId}`, {id:propertyId, images:iimages.join(",")})
                                response.status(200).send<Property>(updated)
                            },
                            patch: async (request, response) => {
                                const {propertyId, imageId} = request.params
                                const property = await findProperty(propertyId, request.user)
                                if(!property) return response.status(404).send({error: "Not found (1)"})
                                if(property.owner !== request.user!.id) {
                                    if(!request.user!.role.includes("admin"))
                                        return response.status(403).send({error: "Forbidden"})
                                }
                                const ret = await rotatePicture(propertyId, imageId, request.query.rotation ? parseInt(request.query.rotation || "90") : 90, property)
                                response.status(200).send<Property>(ret.prop)
                            }
                        }
                    },
                    middlewares: [auth]
                },
            }
        },
        "user": {
            routes: {
                "me": {
                    get: [async (request, response) => {
                        const ffilter = [
                            {owner: {"_eq": request.user!.id}}
                        ]
                        const properties = await getProperties(ffilter, true) as Property[]
                        response.status(200).send(properties)
                    }, [auth]]
                },
                ":userId": {
                    get: async (request, response) => {
                        let {userId} = request.params
                        const ffilter = [
                            {private: {"_eq": false}},
                            {owner: {"_eq": userId}}
                        ]
                        const properties = await getProperties(ffilter) as PublicProperty[]
                        response.status(200).send(properties)
                    },
                }
            }
        },
        "favourites": {
            get: async (request, response) => {
                const userId = request.user!.id
                const {favourites} = await dal.get<Partial<User>>(`/items/users/${userId}?fields[]=favourites`)
                let properties:PublicProperty[] = []
                if(favourites && favourites.length) { 
                    const qso:any = {
                        "filter": JSON.stringify({"_and": [
                            {private: false},
                            {id: {"_in": favourites.split(",")}}
                        ]}),
                        "fields[]": publicPropertyWithOwnerFields.filter(s => !!s).join(","),
                    }
                
                    const url = `/items/properties?${new URLSearchParams(qso).toString()}`
                    properties = (await dal.find<PublicProperty>(url) || [])
                }
                response.status(200).send(properties)
            },
            routes: {
                ":propId": {
                    patch: async (request, response) => {
                        const userId = request.user!.id
                        const {propId} = request.params
                        const prop = await dal.get<Partial<Property>>(`/items/properties/${propId}?fields[]=private`).catch(err => null)
                        if(!prop || prop.private) return response.status(404).send({error: "Not found"})
                        const {favourites} = await dal.get<Partial<User>>(`/items/users/${userId}?fields[]=favourites`)
                        let favs = (favourites || "").split(",").filter(f => !!f && f.length)
                        if(!favs.includes(propId)) {
                            favs.push(propId)
                        } else {
                            favs = favs.filter(f => f !== propId)
                        }
                        favs = [...new Set(favs)];
                        await dal.update<User>(`/items/users/${userId}`, {favourites: favs.join(",")})
                        response.status(200).send(favs)
                    }
                }
            },
            middlewares: [auth]
        }
    },
}

export default route