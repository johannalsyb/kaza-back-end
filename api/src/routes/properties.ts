import type Property from '../../../common/src/types/Property'
import { dal } from '../dal'
import { BRoute } from '../types'
import auth from '../middlewares/auth'
import User from '../../../common/src/types/User'
import s3 from '../services/s3'
import { DIRECTUS_QUERY_LIMIT, IMAGE_SERVER, S3_IMAGES_BUCKET, S3_IMAGES_PREFIX } from '../config'
import gmaps, { Gmaps } from '../services/gmaps'
import { AvailableSlot, PublicProperty } from '../../../common/src/types/Property'
import { rotatePicture, uploadPictures } from '../models/property'
import { addressLookup, autocomplete, zoneLookup } from '../utils/location'
import { PrivateProperty } from '../../../common/src/types/api/properties'
import redis, { find } from '../services/redis'
import { v4 as uuidv4 } from "uuid";

const MAX_AVAILABLE_SLOTS = 3;


function validateAvailableSlotRanges(slots: any[]): { isValid: boolean; error?: string; data?: AvailableSlot[] } {
    if (!Array.isArray(slots)) {
        return { isValid: false, error: "availableSlots must be an array" };
    }

    const parsedSlots: AvailableSlot[] = [];

    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (!slot.dateFrom || !slot.dateTo) {
            return { isValid: false, error: `Slot ${i + 1} must have both dateFrom and dateTo` };
        }

        const from = new Date(slot.dateFrom);
        const to = new Date(slot.dateTo);

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            return { isValid: false, error: `Slot ${i + 1} has invalid date format` };
        }

        if (from >= to) {
            return { isValid: false, error: `Slot ${i + 1} dateFrom must be before dateTo` };
        }

        parsedSlots.push({
            id: uuidv4(),  // generate ID automatically
            dateFrom: from.toISOString(),
            dateTo: to.toISOString()
        });
    }

    return { isValid: true, data: parsedSlots };
}


const findProperty = async (id: string, user?: User) => {
    if (!user) return null
    const prop = await dal.get<Property>(`/items/properties/${id}`)
        .catch(err => {
            return null
        })
    if (!prop) return null

    if (prop.private) {
        if (user.role.includes("admin")) return prop
        else if (prop.owner === user.id) return prop
        return null
    } else return prop
}

const getProperties = async (filter: any[], privateFields = false) => {
    const qso: any = {
        "filter": JSON.stringify({ "_and": filter }),
        "fields[]": publicPropertyFields.filter(s => !!s).join(","),
    }

    if (privateFields) qso["fields[]"] = [qso["fields[]"], ...privatePropertyFields].join(",")

    const url = `/items/properties?${new URLSearchParams(qso).toString()}`
    return (await dal.find<PublicProperty | PrivateProperty>(url) || [])
}

// Import the type from your Property file
type AvailebleDates = {
    id: string,
    value: string[]
}

export const findPropertyByOwner = async (ownerId: string): Promise<Property | null> => {
    const filter = [{ owner: { "_eq": ownerId } }]
    const props = await getProperties(filter, true) as Property[]
    return props.length ? props[0] : null
}


// Validation function for available dates/slots
const validateAvailableSlots = (availebleDates: any): { isValid: boolean; error?: string } => {
    if (!availebleDates) {
        return { isValid: true }; // If not provided, it's valid (empty array will be set)
    }

    if (!Array.isArray(availebleDates)) {
        return {
            isValid: false,
            error: "Available dates must be an array"
        };
    }

    if (availebleDates.length > MAX_AVAILABLE_SLOTS) {
        return {
            isValid: false,
            error: `Maximum ${MAX_AVAILABLE_SLOTS} available slots allowed per property`
        };
    }

    // Validate each slot structure
    for (const slot of availebleDates) {
        if (!slot || typeof slot !== 'object') {
            return {
                isValid: false,
                error: "Each slot must be an object"
            };
        }

        if (!slot.id || typeof slot.id !== 'string') {
            return {
                isValid: false,
                error: "Each available slot must have a valid 'id' string"
            };
        }

        if (!Array.isArray(slot.value)) {
            return {
                isValid: false,
                error: "Each available slot must have a 'value' array"
            };
        }

        // Validate that all values in the array are strings
        if (!slot.value.every((val: any) => typeof val === 'string')) {
            return {
                isValid: false,
                error: "All values in slot 'value' array must be strings"
            };
        }
    }

    return { isValid: true };
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
    "availebleDates",
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

const route: BRoute = {
    get: async (request, response) => {
        const { filter, page, search } = request.query
        const json = filter ? JSON.parse(filter as string) : []
        let ffilter = !json.isArray ? json : []
        ffilter.push({ private: { "_eq": false } })
        ffilter.push({ verified: { "_eq": true } })
        if (search) {
            if (!search || search.length < 3) return response.status(400).send({ error: "Minimum 3 characters" })
            const zone = await zoneLookup(search)
            if (!zone) return response.status(400).send({ error: "Invalid search zone" })
            ffilter.push({ "lat": { "_gte": zone.boundaries.low.lat, "_lte": zone.boundaries.high.lat } })
            ffilter.push({ "lon": { "_gte": zone.boundaries.low.lon, "_lte": zone.boundaries.high.lon } })
        }
        const qso: any = {
            "filter": JSON.stringify({ "_and": ffilter }),
            "fields[]": publicPropertyWithOwnerFields.join(","),
            "sort": "-createdDate,-attractiveness,-createdAt"
        }
        if (page) qso["page"] = page
        const url = `/items/properties?${new URLSearchParams(qso).toString()}`
        const properties = (await dal.find<PublicProperty>(url, {
            limit: DIRECTUS_QUERY_LIMIT,
            page: page ? parseInt(page as string) : 1
        }) || [])
        response.status(200).send(properties)
    },
    post: [async (request, response) => {
        const { address, availebleDates, availableSlots } = request.body

        if (!address || !address.length) return response.status(400).send({ error: "No address" })

        // Validate available slots
        const slotsValidation = validateAvailableSlots(availebleDates);
        if (!slotsValidation.isValid) {
            return response.status(400).send({ error: slotsValidation.error });
        }

        // Validate available slots (dateFrom/dateTo)
        // Validate and auto-generate IDs for availableSlots
        let validatedSlots: AvailableSlot[] = [];
        if (availableSlots && Array.isArray(availableSlots)) {
            const slotValidation = validateAvailableSlotRanges(availableSlots);
            if (!slotValidation.isValid) {
                return response.status(400).send({ error: slotValidation.error });
            }
            validatedSlots = slotValidation.data!;
        }

        const fullAddress = await addressLookup(address)
        if (!fullAddress) return response.status(406).send({ error: "Invalid address" })
        const approx = await gmaps.approximateCoordinates(fullAddress.lat, fullAddress.lon)

        const { verified } = await dal.get<Partial<User>>(`/items/users/${request.user!.id}?fields[]=verified`)
        const property: Property = {
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
            private: !verified,
            availebleDates: availebleDates || [],
            availableSlots: validatedSlots
        }
        property.images = ""

        const prop = await dal.create<Property>(`/items/properties`, property)

        let imgs = []
        if (Array.isArray(request.body.images) && request.body.images.length) {
            imgs = await uploadPictures(prop, request.body.images)
            prop.images = imgs.join(",")
        }

        response.status(200).send(prop)
    }, [auth]],
    routes: {
        ":propertyId": {
            get: async (request, response) => {
                const { propertyId } = request.params
                const property = await dal.get<PublicProperty>(`/items/properties/${propertyId}?fields[]=${publicPropertyWithOwnerFields.join(",")}`)
                    .catch(err => null)
                if (!property) return response.status(404).send({ error: "Not found" })
                response.status(200).send(property)
            },
            patch: [async (request, response) => {
                const { propertyId } = request.params
                const property = await findProperty(propertyId, request.user)
                if (!property) return response.status(404).send({ error: "Not found" })
                const { body } = request as { body: Partial<Property> }

                // Validate available slots if being updated
                if (body.availebleDates) {
                    const slotsValidation = validateAvailableSlots(body.availebleDates);
                    if (!slotsValidation.isValid) {
                        return response.status(400).send({ error: slotsValidation.error });
                    }
                }

                console.log('body', body)
                const forbiddenKeys: (keyof Property)[] = [
                    "id", "owner", "verified", "lat", "lon", "approxLat", "approxLon", "createdAt", "updatedAt",
                    "city", "country", "region"
                ]
                forbiddenKeys.forEach(k => {
                    delete body[k]
                })

                const nproperty: Property = {
                    ...property,
                    ...body,
                    updatedAt: new Date().toISOString()
                }

                if (body.address && body.address !== property.address) {
                    const fullAddress = await addressLookup(body.address)
                    if (!fullAddress) return response.status(406).send({ error: "Invalid address" })
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
                if (Array.isArray(body.images) && body.images.length) {
                    imgs = await uploadPictures(property, body.images, false)
                    nproperty.images = (property.images && property.images.length ? [...imgs, property.images] : imgs).join(",")
                }

                if (body.primaryImage) {
                    const nn = (nproperty.images || property.images).split(",").filter(i => i !== body.primaryImage)
                    nn.unshift(body.primaryImage)
                    nproperty.images = nn.join(",")
                }

                await redis.remove(`marker:${propertyId}`)
                console.log('nproperty', nproperty)
                const updated = await dal.update<Property>(`/items/properties/${propertyId}`, nproperty)
                response.status(200).send(updated)
            }, [auth]],
            routes: {
                "pictures": {
                    post: async (request, response) => {
                        const { propertyId } = request.params
                        const property = await findProperty(propertyId, request.user)
                        if (!property) return response.status(404).send({ error: "Not found" })
                        if (!request.body.files || !request.body.files.length) return response.status(400).send({ error: "No files" })
                        const files = request.body.files as string[]
                        // const images = await uploadPictures(property, files)
                        // response.status(200).send({ images })
                        try {
                            const files = request.body.files as string[]
                            const images = await uploadPictures(property, files)
                            response.status(200).send({ images })
                        } catch (err) {
                            console.error("Upload failed:", err)
                            response.status(400).send({ error: "Invalid image upload" })
                        }
                    },
                    routes: {
                        ":imageId": {
                            delete: async (request, response) => {
                                const { propertyId, imageId } = request.params
                                const property = await findProperty(propertyId, request.user)
                                if (!property) return response.status(404).send({ error: "Not found (1)" })
                                const iimage = (property.images as string).split(",").find(i => i === imageId)
                                if (!iimage) return response.status(404).send({ error: "Not found (2)" })
                                const images = await s3.getInstance("images").ls(S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/properties/${property.id}/${imageId}`)
                                if (images.length) {
                                    await Promise.all(images.map(i => s3.getInstance("images").del(S3_IMAGES_BUCKET, i).catch(err => { })))
                                }
                                const iimages = (property.images as string).split(",").filter(i => i !== imageId)
                                const updated = await dal.update<Property>(`/items/properties/${propertyId}`, { id: propertyId, images: iimages.join(",") })
                                response.status(200).send<Property>(updated)
                            },
                            patch: async (request, response) => {
                                const { propertyId, imageId } = request.params
                                const property = await findProperty(propertyId, request.user)
                                if (!property) return response.status(404).send({ error: "Not found (1)" })
                                if (property.owner !== request.user!.id) {
                                    if (!request.user!.role.includes("admin"))
                                        return response.status(403).send({ error: "Forbidden" })
                                }
                                const ret = await rotatePicture(propertyId, imageId, request.query.rotation ? parseInt(request.query.rotation || "90") : 90, property)
                                response.status(200).send<Property>(ret.prop)
                            }
                        }
                    },
                    middlewares: [auth]
                },
                "slots": {
                    get: async (request, response) => {
                        const { propertyId } = request.params
                        const property = await dal.get<Property>(`/items/properties/${propertyId}?fields[]=availebleDates`)
                            .catch(err => null)
                        if (!property) return response.status(404).send({ error: "Not found" })

                        // Check if user has permission to view this property's slots
                        // if (property.private && (!request.user || (property.owner !== request.user.id && !request.user.role.includes("admin")))) {
                        //     return response.status(403).send({ error: "Forbidden" })
                        // }

                        response.status(200).send({
                            availableSlots: property.availebleDates || [],
                            maxSlots: MAX_AVAILABLE_SLOTS,
                            remainingSlots: MAX_AVAILABLE_SLOTS - (property.availebleDates?.length || 0)
                        })
                    },
                    post: async (request, response) => {
                        const { propertyId } = request.params
                        const property = await findProperty(propertyId, request.user)
                        if (!property) return response.status(404).send({ error: "Not found" })

                        const currentSlots = property.availebleDates || []
                        const newSlot = request.body as AvailebleDates

                        // Validate new slot structure
                        const singleSlotValidation = validateAvailableSlots([newSlot]);
                        if (!singleSlotValidation.isValid) {
                            return response.status(400).send({ error: singleSlotValidation.error });
                        }

                        // Check if we're at the limit
                        if (currentSlots.length >= MAX_AVAILABLE_SLOTS) {
                            return response.status(400).send({
                                error: `Maximum ${MAX_AVAILABLE_SLOTS} available slots allowed per property`
                            })
                        }

                        // Check for duplicate slot IDs
                        if (currentSlots.some(slot => slot.id === newSlot.id)) {
                            return response.status(400).send({
                                error: "Slot with this ID already exists"
                            })
                        }

                        const updatedSlots: AvailebleDates[] = [...currentSlots, newSlot]
                        const updated = await dal.update<Property>(`/items/properties/${propertyId}`, {
                            availebleDates: updatedSlots
                        })

                        response.status(200).send({
                            availableSlots: updatedSlots,
                            maxSlots: MAX_AVAILABLE_SLOTS,
                            remainingSlots: MAX_AVAILABLE_SLOTS - updatedSlots.length
                        })
                    },
                    routes: {
                        ":slotId": {
                            patch: async (request, response) => {
                                const { propertyId, slotId } = request.params
                                const property = await findProperty(propertyId, request.user)
                                if (!property) return response.status(404).send({ error: "Not found" })

                                const currentSlots = property.availebleDates || []
                                const slotIndex = currentSlots.findIndex(slot => slot.id === slotId)

                                if (slotIndex === -1) {
                                    return response.status(404).send({ error: "Slot not found" })
                                }

                                const updatedSlot: AvailebleDates = {
                                    ...currentSlots[slotIndex],
                                    ...request.body
                                }

                                // Validate the updated slot
                                const singleSlotValidation = validateAvailableSlots([updatedSlot]);
                                if (!singleSlotValidation.isValid) {
                                    return response.status(400).send({ error: singleSlotValidation.error });
                                }

                                const updatedSlots: AvailebleDates[] = [...currentSlots]
                                updatedSlots[slotIndex] = updatedSlot

                                const updated = await dal.update<Property>(`/items/properties/${propertyId}`, {
                                    availebleDates: updatedSlots
                                })

                                response.status(200).send({
                                    slot: updatedSlot,
                                    availableSlots: updatedSlots
                                })
                            },
                            delete: async (request, response) => {
                                const { propertyId, slotId } = request.params
                                const property = await findProperty(propertyId, request.user)
                                if (!property) return response.status(404).send({ error: "Not found" })

                                const currentSlots = property.availebleDates || []
                                const updatedSlots: AvailebleDates[] = currentSlots.filter(slot => slot.id !== slotId)

                                if (updatedSlots.length === currentSlots.length) {
                                    return response.status(404).send({ error: "Slot not found" })
                                }

                                const updated = await dal.update<Property>(`/items/properties/${propertyId}`, {
                                    availebleDates: updatedSlots
                                })

                                response.status(200).send({
                                    availableSlots: updatedSlots,
                                    maxSlots: MAX_AVAILABLE_SLOTS,
                                    remainingSlots: MAX_AVAILABLE_SLOTS - updatedSlots.length
                                })
                            }
                        }
                    },
                    middlewares: [auth]
                }
            }
        },
        "user": {
            routes: {
                "me": {
                    get: [async (request, response) => {
                        const ffilter = [
                            { owner: { "_eq": request.user!.id } }
                        ]
                        const properties = await getProperties(ffilter, true) as Property[]
                        response.status(200).send(properties)
                    }, [auth]]
                },
                ":userId": {
                    get: async (request, response) => {
                        let { userId } = request.params
                        const ffilter = [
                            { private: { "_eq": false } },
                            { owner: { "_eq": userId } }
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
                const { favourites } = await dal.get<Partial<User>>(`/items/users/${userId}?fields[]=favourites`)
                let properties: PublicProperty[] = []
                if (favourites && favourites.length) {
                    const qso: any = {
                        "filter": JSON.stringify({
                            "_and": [
                                { private: false },
                                { id: { "_in": favourites.split(",") } }
                            ]
                        }),
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
                        const { propId } = request.params
                        const prop = await dal.get<Partial<Property>>(`/items/properties/${propId}?fields[]=private`).catch(err => null)
                        if (!prop || prop.private) return response.status(404).send({ error: "Not found" })
                        const { favourites } = await dal.get<Partial<User>>(`/items/users/${userId}?fields[]=favourites`)
                        let favs = (favourites || "").split(",").filter(f => !!f && f.length)
                        if (!favs.includes(propId)) {
                            favs.push(propId)
                        } else {
                            favs = favs.filter(f => f !== propId)
                        }
                        favs = [...new Set(favs)]
                        await dal.update<User>(`/items/users/${userId}`, { favourites: favs.join(",") })
                        response.status(200).send(favs)
                    }
                }
            },
            middlewares: [auth]
        }
    },
}

export default route