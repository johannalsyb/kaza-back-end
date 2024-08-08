import User from "../../../common/src/types/User";
import Match from "../../../common/src/types/Match";
import Property from "../../../common/src/types/Property";
import { dal } from "../dal";
import { MATCH_DAYS_THRESHOLD } from "../config";
import { zoneLookup } from "../utils/location";

const APPROX_DAYS_MS = MATCH_DAYS_THRESHOLD*24*60*60*1000

export const findMatchesByUser = async (user: User, debug = false): Promise<{matches: Match[], debug?: any}> => {
    let debugData:any = {}
    if(!user.verified) return {matches: []}
    /* 1. Match users with dates */
    const matchingDatesDefinition:any = []
    if(user.dateFrom && user.dateTo) {
        // That user want to swap at specific dates
        matchingDatesDefinition.push({"dateFrom": {"_null": true}})
        matchingDatesDefinition.push({"dateTo": {"_null": true}})
        matchingDatesDefinition.push({
            "_and": [
                {"dateFrom": {"_between": [user.dateFrom-APPROX_DAYS_MS, user.dateFrom+APPROX_DAYS_MS]}},
                {"dateTo": {"_between": [user.dateTo-APPROX_DAYS_MS, user.dateTo+APPROX_DAYS_MS]}}
            ]
        })
    }
    debugData["matchingDatesDefinition"] = {matchingDatesDefinition}

    const matchingUserDefinition:any = {
        "_and": [
            {"verified": true}, // User must be verified
            {"id": {"_neq": user.id}}, // And not be himself
            matchingDatesDefinition.length ? {"_or": matchingDatesDefinition} : null
        ].filter(a => !!a)
    }
    const matchingUsers = await dal.find<User>(`/items/users?filter=${JSON.stringify(matchingUserDefinition)}`)
    debugData["matchingUserDefinition"] = {matchingUserDefinition, matchingUsers: matchingUsers}
    if(!matchingUsers.length) return {matches: [], debug: debugData}

    /* 2. Match properties with location */
    const matchingPropertiesDefinition:any = []
    if(user.swapLocations && user.swapLocations.length) {
        // That user want to swap with one or more specific locations
        const locations = user.swapLocations.split("\n").map(l => l.trim())
        const locs = await Promise.all(locations.map(l => zoneLookup(l)))
        const locsDefinition:{"_and": [
            {"lat": {"_between": [number, number]}},
            {"lon": {"_between": [number, number]}}
        ]}[] = []
        locs.forEach(loc => {
            if(loc) {
                locsDefinition.push({"_and": [
                    {"lat": {"_between": [loc.boundaries.low.lat, loc.boundaries.high.lat]}},
                    {"lon": {"_between": [loc.boundaries.low.lon, loc.boundaries.high.lon]}}
                ]})
            }
        })
        matchingPropertiesDefinition.push({"_or": locsDefinition}) // Property must be within the boundaries of the selected locations
    }
    matchingPropertiesDefinition.push({"owner": {"_in": matchingUsers.map(u => u.id)}}) // Property owner must be one of the matching users
    matchingPropertiesDefinition.push({"verified": true}) // Property must be verified
    matchingPropertiesDefinition.push({"private": false}) // Property must be public    
    const props = await dal.find<Property>(`/items/properties?filter=${JSON.stringify({"_and": matchingPropertiesDefinition})}`)

    debugData["matchingPropertiesDefinition"] = {matchingPropertiesDefinition, matchingProperties: props}

    /* 3. Build matches */
    const matches:Partial<Match>[] = []
    props.forEach(prop => {
        const match:Partial<Match> = {
            id: `${user.id}_${prop.id}`,
            property: prop.id,
            user: user.id,
        }
        matches.push(match)
    })

    /* 4. Save in db if they don't exist */
    const existingMatches = matches.length ? await dal.find<Match>(`/items/matches?filter=${JSON.stringify({"id": {"_in": matches.map(m => (m.id))}})}`) : []
    const existingMatchesIds = existingMatches.map(m => m.id)
    const filteredMatches = matches.filter(m => !existingMatchesIds.includes(m.id!))
    const newMatches = await Promise.all(filteredMatches.map(m => dal.create<Match>("/items/matches", m)))
    return {matches: [...newMatches, ...existingMatches].filter(m => !m.deleted), debug:debugData}
}

export const getUserMatches = async (userId: string): Promise<Match[]> => {
    const matches = await dal.find<Match>(`/items/matches?filter=${JSON.stringify({"user": {"_eq": userId}})}&sort=seen,-createdAt`)
    return matches.filter(m => !m.deleted)
}

export const countNewMatchesForUser = async (userId: string): Promise<number> => {
    const matches = await dal.find<Match>(`/items/matches?fields=id&filter=${JSON.stringify({"user": {"_eq": userId}, "seen": {"_eq": false}})}`)
    return matches.length
}

export const rebuildMatches = async (options:{
    maxSimultaneousUsers?:number,
    userId?:string
    debug?:boolean
}) => {
    let allMatches:Match[] = []
    let debug:any = {}
    if(options.userId) {
        const user = await dal.get<User>(`/items/users/${options.userId}`).catch(err => undefined)
        if(!user) return {matches: []}
        const ret = await findMatchesByUser(user, options.debug)
        allMatches = ret.matches
        debug = ret.debug
    } else {
        const maxSimultaneousUsers = options.maxSimultaneousUsers || 5
        const [{count}] = await dal.get<[{count: number}]>("/items/users?aggregate[count]=*")
        const nbPages = Math.ceil(count/maxSimultaneousUsers)
        for(var page = 1; page <= nbPages; page++) {
            const users = await dal.find<User>(`/items/users?page=${page}&limit=${maxSimultaneousUsers}`)
            const ret = await Promise.all(users.map(u => findMatchesByUser(u).catch(err => ({matches: [] as Match[], debug: {error: err}}))))
            const matches = ret.map(r => r.matches)
            allMatches = allMatches.concat(matches.flat())
        }
    }
    return {matches: allMatches, debug}
}