import { BRoute, BRouteWebsocketHandler } from '../types'
import cors from '../middlewares/cors'

import auth from './auth'
import properties from './properties'
import users from './users'
import swaps from './swaps'
import config from './config'
import matches from './matches'
import autocomplete from './autocomplete'
import admin from "./admin"
import blog from "./blog"
import images from './images'
import contract from './contract'

const route:BRoute = {
    get: (request, response) => {
        response.status(200).send({status: "OK"})
    },
    routes: {
        auth,
        properties,
        users,
        swaps,
        matches,
        autocomplete,
        config,
        admin,
        blog,
        images,
        contract,
    },
    middlewares: [cors]
}

export default route