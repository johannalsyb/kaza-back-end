import { md5 } from "."
import Api from "../../../common/src/types/api"
import gmaps, { Geocoding, Gmaps } from "../services/gmaps"
import redis from "../services/redis"

type AddressLookup = {
    country: string,
    region?: string | null,
    city: string,
    address: string,
    lat: number,
    lon: number,
}

export const addressLookup = async (address: string):Promise<AddressLookup | null> => {
    try {
        const hash = md5(address.toLowerCase().trim())
        let add:Geocoding | null = await redis.get(`lookup:address:${hash}`) as Geocoding | null
        if(!add) {
            add = await gmaps.searchAddress(address)
            if(!add) return null
            await redis.save(`lookup:address:${hash}`, add, undefined, 5*3600*24*7) // 5 week
                .catch(err => {
                    console.log("ERROR: Cannot store into REDIS")
                })
        }
        if(!add.geocode?.location?.lat || !add.geocode?.location?.lon || !add.areaKm) return null
        if(add.areaKm > 100) return null // If the address is too big, it's probably not an address so we skip it

        if(!add.city) {
            if(add.region) add.city = add.region
            else {
                // In this case, take the second to last element of the address
                const parts = add.address.split(",")
                parts.pop()
                const place = parts.pop()
                if(place) add.city = place
                else return null
            }
        }

        return {
            country: add.country,
            region: add.region,
            city: add.city,
            address: address,
            lat: add.geocode.location.lat,
            lon: add.geocode.location.lon,
        }
    } catch(err) {
        console.log(err)
        return null
    }
}

export const zoneLookup = async (zone: string) => {
    try {
        const hash = md5(zone.toLowerCase().trim())
        let add:Geocoding | null = await redis.get(`lookup:zone:${hash}`) as Geocoding | null
        if(!add) {
            add = await gmaps.geocodeZone(zone)
            if(!add) return null
            await redis.save(`lookup:zone:${hash}`, add, undefined, 5*3600*24*7) // 5 week
                .catch(err => {
                    console.log("ERROR: Cannot store into REDIS")
                })
        }
        if(!add || !add.country || !add.geocode?.bounds) return null
        return {
            country: add.country,
            region: add.region,
            city: add.city,
            boundaries: add.geocode.bounds
        }
    } catch(err) {
        console.log(err)
        return null
    }
}

export const autocomplete = async (address:string) => {
    try {
        const hash = md5(address.toLowerCase().trim())
        let auto:Api.Autocomplete.Response | null = await redis.get(`lookup:autocomplete:${hash}`) as Api.Autocomplete.Response | null
        if(!auto) {
            const results = await gmaps.autocomplete(address)
            console.log('results', results);
            auto = {address, ts: Date.now(), results}
            await redis.save(`lookup:autocomplete:${hash}`, auto, undefined, 30*3600*24*7) // 30 weeks
                .catch(err => {
                    console.log("ERROR: Cannot store into REDIS")
                })
        }
        return auto
    } catch(err) {
        console.log(err)
        return null
    }
}

export const latLonToAddress = async (lat:number, lon:number, force = false) => {
    try {
        const hash = `${lat},${lon}`
        let geos:Geocoding[] = await redis.get(`lookup:latlon:${hash}`) as Geocoding[]
        if(!geos || force) {
            geos = await gmaps.latLonToAddress(lat, lon)
            await redis.save(`lookup:latlon:${hash}`, geos, undefined, 30*3600*24*7) // 30 weeks
                .catch(err => {
                    console.log("ERROR: Cannot store into REDIS")
                })
        }
        return geos
    } catch(err) {
        console.log(err)
        return null
    }
}

export default {
    addressLookup,
    zoneLookup,
    autocomplete: gmaps.autocomplete,
    latLonToAddress
}