import { Api } from '../../../common/src'
import { Gmaps } from '../services/gmaps'
import { BRoute } from '../types'
import { addressLookup, autocomplete, latLonToAddress } from '../utils/location'

const route:BRoute = {
    routes: {
        "zone": {
            get: async (request, response) => {
                const {search, type} = request.query
                if(!search || search.trim().length < 3) return response.status(400).send({error: "Minimum 3 characters"})
                const completion = await autocomplete(search)
                if(!completion) return response.status(400).send({error: "Invalid search"})
                const intersection = completion?.results.filter(e => {
                    for(var t of Gmaps.addressTypes.zones) {
                        if(e.types.includes(t)) return true
                    }
                    return false
                })
                completion.results = intersection.filter(i => !!i)
                response.status(200).send(completion)
            }
        },
        "address": {
            get: async (request, response) => {
                const {search, type, refresh} = request.query
                if(!search || search.trim().length < 3) return response.status(400).send({error: "Minimum 3 characters"})

                let searchString = search
                let completion:Api.Autocomplete.Response | null = null
                // Check if it's gps coordinates
                if(search.match(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)) {
                    const [llat,llon] = search.split(",")
                    const lat = parseFloat(llat)
                    const lon = parseFloat(llon)
                    const geos = await latLonToAddress(lat, lon, refresh === "true")
                    const intersection = geos?.filter(e => {
                        if(!e.types) return false
                        for(var t of Gmaps.addressTypes.address) {
                            if(e.types.includes(t)) return true
                        }
                        return false
                    })
                    const closests = intersection?.sort((a,b) => (a.areaKm || 99999) - (b.areaKm || 99999))
                    if(!closests || !closests[0]) return response.status(400).send({error: "Invalid search"})
                        // completion.results = intersection.filter(i => !!i)
                    const closest = closests[0]
                    completion = {
                        address: closest.address,
                        results: [{
                            description: closest.address,
                            matched_substrings: [],
                            terms: [],
                            types: closest.types!
                        }],
                        ts: Date.now()
                    }

                } else {
                    completion = await autocomplete(searchString)
                    if(!completion) return response.status(400).send({error: "Invalid search"})
                    const intersection = completion?.results.filter(e => {
                        for(var t of Gmaps.addressTypes.address) {
                            if(e.types.includes(t)) return true
                        }
                        return false
                    })
                    completion.results = intersection.filter(i => !!i)
                }
                response.status(200).send(completion)
            }
        },
        "verify": {
            get: async (request, response) => {
                const {address} = request.query
                if(!address || address.trim().length < 3) return response.status(400).send({error: "Minimum 3 characters"})
                const fullAddress = await addressLookup(address)
                if(!fullAddress) return response.status(406).send({error: "Invalid address"})
                response.status(200).send(fullAddress)
            }
        },
    },
    middlewares: []
}

export default route