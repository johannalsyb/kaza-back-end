import { request } from "../utils"
import { GMAPS_APIKEY } from "../config"

export namespace Gmaps {
    export type AddressVerificationResponse = {
        result: {
            verdict: {
                inputGranularity: string,
                validationGranularity: string,
                geocodeGranularity: string,
                addressComplete: boolean,
                hasUnconfirmedComponents: boolean,
                hasInferredComponents: boolean
            },
            address: {
                formattedAddress: string,
                postalAddress: {
                    regionCode: string,
                    languageCode: string,
                    postalCode: string,
                    locality: string,
                    addressLines: string[]
                    sublocality?: string,
                    administrativeArea?: string,
                },
                addressComponents: {
                    componentName: any[],
                    componentType: string,
                    confirmationLevel: string,
                    inferred?: boolean
                }[],
                unconfirmedComponentTypes: string[]
            },
            geocode: {
                location: {
                    latitude: number,
                    longitude: number
                },
                plusCode: {
                    globalCode: string,
                    compoundCode?: string
                },
                bounds: {
                    low: {
                        latitude: number,
                        longitude: number
                    },
                    high: {
                        latitude: number,
                        longitude: number
                    }
                },
                featureSizeMeters: number,
                placeId: string,
                placeTypes: string[]
            },
            metadata: { business: boolean, residential: boolean }
        },
        responseId: string
    }

    export type PlaceDetail = {
        address_components: {
            long_name: string,
            short_name: string,
            types: string[]
        }[],
        formatted_address: string,
        geometry: {
            location: {
                lat: number,
                lng: number
            },
            location_type?: string,
            viewport: {
                northeast: {
                    lat: number,
                    lng: number
                },
                southwest: {
                    lat: number,
                    lng: number
                }
            }
        },
        place_id: string,
        plus_code: {
            compound_code: string,
            global_code: string
        },
        types: string[]
    }

    export type PlaceDetailResponse = {
        result: PlaceDetail,
        error_message?: string,
        status: string
    }

    export type GeocodeResponse = {
        results: PlaceDetail[],
        error_message?: string,
        status: string
    }

    export const addressTypes = {
        zones: [
            "locality",
            "sublocality",
            "postal_code",
            "country",
            "administrative_area_level_1",
            "administrative_area_level_2",
        ],
        address: [
            "premise",
            "subpremise",
            "town_square",
            "street_address",
            "street_number",
            "room",
            "route"
        ]
    }

    export type Autocomplete = {
        "description": string,
        "matched_substrings": {
            "length": number,
            "offset": number
        }[],
        "terms": {
            "offset": number,
            "value": string
        }[],
        "types": string[],
        place_id: string,
        reference: string
    }

    export type AutocompleteResponse = {
        predictions: Autocomplete[],
        error_message?: string,
        status: string
    }

    export type SearchResponse = {
        html_attributions: [],
        results: {
            formatted_address: string,
            geometry:
            {
                location: { lat: number, lng: number },
                viewport:
                {
                    northeast:
                    { lat: number, lng: number },
                    southwest:
                    { lat: number, lng: number },
                },
            },
            icon: string,
            icon_background_color: string,
            icon_mask_base_uri: string,
            name: string,
            place_id: string,
            reference: string,
            types: string[],
        }[],
        error_message?: string,
        status: string,
    }
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371 // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1)  // deg2rad below
    var dLon = deg2rad(lon2 - lon1)
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    var d = R * c // Distance in km
    return d
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

export const approximateCoordinates = (lat: number, lon: number) => {
    const delta = 0.005 // 550m radius
    return {
        lat: lat - Math.random() * delta,
        lon: lon - Math.random() * delta
    }
}

export type Geocoding = {
    country: string,
    region?: string | null,
    city: string | null,
    address: string,
    areaKm: number | null,
    geocode: {
        location: {
            lat: number,
            lon: number
        },
        bounds: {
            low: {
                lat: number,
                lon: number
            },
            high: {
                lat: number,
                lon: number
            }
        }
    },
    types?: string[]
}

/* DEPRECATED: Only works for certain countries */
export const validateAddress = async (address: string): Promise<Geocoding | null> => {
    const ret = await request(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${GMAPS_APIKEY}`, {
        method: "POST",
        body: JSON.stringify({
            address: {
                addressLines: [address]
            }
        }),
        headers: {
            "Content-Type": "application/json"
        },
    })

    const { result } = await ret.json() as Gmaps.AddressVerificationResponse
    return {
        country: result?.address?.postalAddress?.regionCode,
        region: result?.address?.postalAddress?.administrativeArea,
        city: result?.address?.postalAddress?.locality,
        address: result?.address?.formattedAddress,
        areaKm: result?.geocode?.featureSizeMeters ? result?.geocode?.featureSizeMeters / 1000 : null,
        geocode: {
            location: {
                lat: result?.geocode?.location.latitude,
                lon: result?.geocode?.location.longitude
            },
            bounds: {
                high: {
                    lat: result?.geocode?.bounds.high.latitude,
                    lon: result?.geocode?.bounds.high.longitude
                },
                low: {
                    lat: result?.geocode?.bounds.low.latitude,
                    lon: result?.geocode?.bounds.low.longitude
                }
            }
        }
    }
}

/* Note: GPS Coordinates are not accurate enough, so we use this for the zone */
export const geocodeZone = async (address: string): Promise<Geocoding | null> => {
    const ret = await request(`https://maps.googleapis.com/maps/api/geocode/json?key=${GMAPS_APIKEY}&address=${encodeURIComponent(address)}`, {
        // method: "POST",
        // body: JSON.stringify({
        //     address: {
        //         addressLines: [address]
        //     }
        // }),
        headers: {
            "Content-Type": "application/json"
        },
    })

    const json = await ret.json() as Gmaps.GeocodeResponse
    if (json.status !== "OK") throw new Error(`Failed to geocode address (${json.status}${json.error_message ? `: ${json.error_message}` : ""})`)

    try {
        const result = json.results[0]
        if (!result) return null

        const width = getDistanceFromLatLonInKm(
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.northeast.lng,
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.southwest.lng
        )
        const height = getDistanceFromLatLonInKm(
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.northeast.lng,
            result.geometry.viewport.southwest.lat,
            result.geometry.viewport.northeast.lng
        )
        const sizeKm = width * height

        const country = result.address_components?.find(c => c.types.includes("country"))?.long_name
        if (!country) return null
        const region = result.address_components?.filter(c => c.types.includes("administrative_area")).reverse()[0]?.long_name
        const city = result.address_components?.filter(c => c.types.includes("locality")).reverse()[0]?.long_name
        return {
            country,
            region,
            city,
            address: result.formatted_address,
            areaKm: sizeKm,
            geocode: {
                location: {
                    lat: result.geometry.location.lat,
                    lon: result.geometry.location.lng
                },
                bounds: {
                    high: {
                        lat: result.geometry.viewport.northeast.lat,
                        lon: result.geometry.viewport.northeast.lng
                    },
                    low: {
                        lat: result.geometry.viewport.southwest.lat,
                        lon: result.geometry.viewport.southwest.lng
                    }
                }

            }
        }
    } catch (e) {
        return null
    }
}

/* This is the best method so far: find the place ID from the address then find the place details from the place ID */
export const searchAddress = async (address: string): Promise<Geocoding | null> => {
    // const ret = await request(`https://maps.googleapis.com/maps/api/place/textsearch/json?key=${GMAPS_APIKEY}&query=${encodeURIComponent(address)}`, {
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    // })
    try {

        // const json = await ret.json() as Gmaps.SearchResponse
        // console.log(`https://maps.googleapis.com/maps/api/place/textsearch/json?key=${GMAPS_APIKEY}&query=${encodeURIComponent(address)}`, json)
        const json = await autocomplete(address)
        // console.log(json)
        // c
        // if(json.status !== "OK") throw new Error(`Failed to search address (${json.status}${json.error_message ? `: ${json.error_message}` : ""})`)

        if (!json[0]) return null

        const ret = await request(`https://maps.googleapis.com/maps/api/place/details/json?key=${GMAPS_APIKEY}&place_id=${json[0].place_id}`, {
            headers: {
                "Content-Type": "application/json"
            },
        })

        const json2 = await ret.json() as Gmaps.PlaceDetailResponse
        if (json2.status !== "OK") throw new Error(`Failed to search address (${json2.status}${json2.error_message ? `: ${json2.error_message}` : ""})`)
        const result = json2.result

        const width = getDistanceFromLatLonInKm(
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.northeast.lng,
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.southwest.lng
        )
        const height = getDistanceFromLatLonInKm(
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.northeast.lng,
            result.geometry.viewport.southwest.lat,
            result.geometry.viewport.northeast.lng
        )
        const sizeKm = width * height

        const country = result.address_components?.find(c => c.types.includes("country"))?.long_name
        if (!country) return null
        const region = result.address_components?.filter(c => c.types.includes("administrative_area")).reverse()[0]?.long_name
        const city = result.address_components?.filter(c => c.types.includes("locality")).reverse()[0]?.long_name
        return {
            country,
            region,
            city,
            address: result.formatted_address,
            areaKm: sizeKm,
            geocode: {
                location: {
                    lat: result.geometry.location.lat,
                    lon: result.geometry.location.lng
                },
                bounds: {
                    high: {
                        lat: result.geometry.viewport.northeast.lat,
                        lon: result.geometry.viewport.northeast.lng
                    },
                    low: {
                        lat: result.geometry.viewport.southwest.lat,
                        lon: result.geometry.viewport.southwest.lng
                    }
                }

            }
        }
    } catch (e) {
        return null
    }
}

const generateLinkGmaps = (type: string) => `https://maps.googleapis.com/maps/api/${type}/json?key=${GMAPS_APIKEY}`


export const autocomplete = async (address: string) => {
    const ret = await request(`${generateLinkGmaps('place/autocomplete')}&input=${encodeURIComponent(address)}`, {
        headers: {
            "Content-Type": "application/json"
        },
    })
    const json = await ret.json() as Gmaps.AutocompleteResponse

    if (json.status !== "OK") throw new Error(`Failed to autocomplete address (${json.status}${json.error_message ? `: ${json.error_message}` : ""})`)

    return json.predictions
}

export const latLonToAddress = async (lat: number, lon: number): Promise<Geocoding[]> => {
    const ret = await request(`${generateLinkGmaps('geocode')}/&latlng=${lat},${lon}`, {
        headers: {
            "Content-Type": "application/json"
        },
    })
    const json = await ret.json() as Gmaps.GeocodeResponse
    if (json.status !== "OK") throw new Error(`Failed to reverse geocode coordinates (${json.status}${json.error_message ? `: ${json.error_message}` : ""})`)

    return json.results.map(result => {
        const width = getDistanceFromLatLonInKm(
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.northeast.lng,
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.southwest.lng
        )
        const height = getDistanceFromLatLonInKm(
            result.geometry.viewport.northeast.lat,
            result.geometry.viewport.northeast.lng,
            result.geometry.viewport.southwest.lat,
            result.geometry.viewport.northeast.lng
        )
        const sizeKm = width * height

        const country = result.address_components?.find(c => c.types.includes("country"))?.long_name
        if (!country) return null
        const region = result.address_components?.filter(c => c.types.includes("administrative_area")).reverse()[0]?.long_name
        const city = result.address_components?.filter(c => c.types.includes("locality")).reverse()[0]?.long_name
        const geo: Geocoding = {
            country,
            region,
            city,
            address: result.formatted_address,
            areaKm: sizeKm,
            geocode: {
                location: {
                    lat: result.geometry.location.lat,
                    lon: result.geometry.location.lng
                },
                bounds: {
                    high: {
                        lat: result.geometry.viewport.northeast.lat,
                        lon: result.geometry.viewport.northeast.lng
                    },
                    low: {
                        lat: result.geometry.viewport.southwest.lat,
                        lon: result.geometry.viewport.southwest.lng
                    }
                }

            },
            types: result.types
        }
        return geo
    }).filter(g => !!g) as Geocoding[]
}

export default {
    // validateAddress,
    geocodeZone,
    searchAddress,
    autocomplete,
    approximateCoordinates,
    latLonToAddress
}