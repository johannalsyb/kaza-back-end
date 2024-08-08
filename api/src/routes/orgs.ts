import type Org from '../../../common/src/types/Org'
import { dal } from '../dal'
import { BRoute } from '../types'
import auth from '../middlewares/auth'
import User from '../../../common/src/types/User'

const route:BRoute = {
    get: async (request, response) => {
        const user = await dal.get<User>(`/items/users/${request.user?.id}?fields[]=orgs`)
        const orgs = await dal.find<Org>(`/items/orgs?filter=${JSON.stringify({"id": {"_in": user.orgs.split(",").map(org => org.trim())}})}`)
        response.status(200).send(orgs)
    },
    routes: {
        ":orgid": {
            get: async (request, response) => {
                const {orgid} = request.params
                const org = await dal.get<Org>(`/items/orgs/${orgid}`)
                if(!org) return response.status(404).send({error: "Not found"})
                response.status(200).send(org)
            },
        },
    },
    middlewares: [auth]
}

export default route