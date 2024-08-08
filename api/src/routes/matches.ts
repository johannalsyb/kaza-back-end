import { BRoute } from '../types'
import auth from '../middlewares/auth'
import { findMatchesByUser, getUserMatches } from '../models/match'
import { dal } from '../dal'
import { User } from '../../../common/src/types/User'
import { PublicProperty } from '../../../common/src/types/Property'
import { publicPropertyWithOwnerFields } from './properties'
import { Api } from '../../../common/src'
import Match from '../../../common/src/types/Match'

const route:BRoute = {
    get: async (request, response) => {
        const {refresh, userId, updateSeen, debug} = request.query
        let matches:Match[]
        let debugData:any = undefined
        let user:User | null = request.user!
        const isAdmin = request.user?.role.includes("admin")
        if(userId && isAdmin) {
            user = await dal.get<User>(`/items/users/${userId}`).catch(err => null)
            if(!user) return response.status(404).send({error: "Not found"})
        }
        if(refresh === "true") {
            const r = await findMatchesByUser(user, debug === "true")
            matches = r.matches
            if(debug === "true")    debugData = r.debug
        } else {
            matches = await getUserMatches(user.id)
        }
        if(!matches.length) return response.status(200).send({matches: [], debug: debugData})
        const props = await dal.find<PublicProperty>(`/items/properties?fields[]=${publicPropertyWithOwnerFields.join(",")}&filter=${JSON.stringify({id: {"_in": matches.map(m => m.property)}})}`)        
        const publicMatches = matches.map(m => {
            const property = props.find(p => p.id === m.property)! as string & PublicProperty
            const match:Api.Matches.Match = {
                ...m,
                property
            }
            return match
        })
        if(updateSeen === "false" || (!!userId && isAdmin)) {
            // DO NOTHING
        } else {
            await dal.updateMany<Match>(`/items/matches`, {seen: true}, ...matches.map(m => m.id))
        }
        response.status(200).send({matches: publicMatches, debug: debugData})
    },
    put: async (request, response) => {
        // This endpoint is to update the user's matches
        const user = await dal.get<User>(`/items/users/${request.user!.id}`).catch(err => null)
        if(!user) return response.status(404).send({error: "Not found"})
        const matches = await findMatchesByUser(user)
        response.status(200).send(matches)
    },
    middlewares: [
        auth
    ]
}

export default route