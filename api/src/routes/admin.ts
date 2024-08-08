import { dal } from '../dal'
import { BRoute } from '../types'
import auth from '../middlewares/auth'
import User from '../../../common/src/types/User'
import {findIncompleteProfiles, markIncompleteProfiles, resetPasswordRequest, sendAccountVerifiedEmail, sendPasswordResetEmail} from '../models/user'
import { getAppUrl } from '../utils'
import admin from '../middlewares/admin'
import Property from '../../../common/src/types/Property'
import bubble from '../utils/bubble'
import { SwapRequest } from '../../../common/src/types/SwapRequest'
import { Swap } from '../../../common/src/types/Swap'
import { getChat, getChatUrl } from '../models/swapRequest'
import redis from '../services/redis'
import { DAEMON_INCOMPLETE_PROFILES_CHECK_HRS } from '../config'
import { checkIncompleteProfiles } from '../daemon'
import fs from "fs/promises"
import sendEmail from "../services/email"
import { rebuildMatches } from '../models/match'
import { debug } from 'console'

const route:BRoute = {
    routes: {
        "users": {
            get: async (request, response) => {
                const usp = new URLSearchParams(request.query || {}).toString()
                const users = await dal.find<User>(`/items/users?${usp}`)
                response.status(200).send<User[]>(users)
            },
            routes: {
                ":userId": {
                    get: async (request, response) => {
                        const {userId} = request.params
                        const user = await dal.get<User>(`/items/users/${userId}?${new URLSearchParams(request.query || {}).toString()}`)
                        if(!user) return response.status(404).send({error: "Not found"})
                        response.status(200).send<User>(user)
                    },
                    delete: async (request, response) => {
                        const {userId} = request.params
                        dal.delete(`/items/users/${userId}`)
                        .then(() => response.status(200).send({}))
                        .catch((e:any) => response.status(500).send({error: e.message}))
                    },
                    routes: {
                        "verify": {
                            get: async (request, response) => {
                                let {userId} = request.params
                                if(!request.query.verify || (request.query.verify !== "true" && request.query.verify !== "false"))
                                return response.status(400).send({error: "Invalid request"})
                                
                                const url = `/items/properties?${new URLSearchParams({filter: JSON.stringify({owner: userId}), sort: "-createdAt"}).toString()}`
                                const props = await dal.find<Property>(url)
                                if(!props.length) {
                                    return response.status(400).send({error: "No property for this user"})
                                }

                                Promise.all([
                                    dal.update<Property>(`/items/properties/${props[0].id}`, {verified: request.query.verify === "true", private: request.query.verify !== "true"}),
                                    dal.update<User>(`/items/users/${userId}`, {verified: request.query.verify === "true"})
                                ])
                                .then(([p, u]) => {
                                    return Promise.all([sendAccountVerifiedEmail(u), u])
                                })
                                .then(([_, u]) => response.status(200).send<User>(u))
                                .catch((e:any) => response.status(500).send({error: e.message}))
                            }
                        },
                        "resetPassword": {
                            get: async (request, response) => {
                                let {userId} = request.params
                                const user = await dal.get<User>(`/items/users/${userId}`)
                                if(!user) return response.status(404).send({error: "Not found"})
                                const host = getAppUrl(request)
                                sendPasswordResetEmail(user, host)
                                .then(url => response.status(200).send({url}))
                                .catch((e:any) => response.status(500).send({error: e.message}))
                            }
                        },
                    }
                },
                "incomplete": {
                    get: async (request, response) => {
                        const {action} = request.query
                        if(action === "mark") {
                            const users = await markIncompleteProfiles()
                            response.status(200).send(users)
                        } else if(action === "send") {
                            const u = await checkIncompleteProfiles()
                            response.status(200).send(u)
                        } else if(action === "find") {
                            const u = await findIncompleteProfiles()
                            response.status(200).send(u)
                        } else {
                            response.status(400).send({error: "Invalid request"})

                        }
                    }
                },
                "importedfrombubble": {
                    get: async (request, response) => {
                        const {action} = request.query
                        const users = await dal.find<User & {launchEmailSent?: string}>(`/items/users?limit=-1&fields=id,firstName,email&filter=${JSON.stringify({id:{"_contains":"x"}})}`)

                        for(const user of users) {
                            const sent = await redis.get(`launchEmailSent:${user.id}`) as {email: string, sentAt: string} | null
                            if(sent) {
                                user.launchEmailSent = sent.sentAt
                            }
                        }

                        if(action === "send") {
                            const host = getAppUrl(request)
                            const uusers = await Promise.all(users.map(user => resetPasswordRequest(user).then(id => ({user, url: `${host}/resetpassword?token=${id}`}))))
                            const emailTemplate = await fs.readFile("./assets/emails/launch_reset_password.html", {encoding: "utf8"})
                            const ret = []
                            const errors = []
                            for(const {user, url} of uusers) {
                                if(user.launchEmailSent) {
                                    console.log("Already sent to", user.launchEmailSent)
                                    continue
                                }
                                const email = {
                                    to: [{email: user.email, name: user.firstName}],
                                    content: emailTemplate.replaceAll("%url%", url).replaceAll("%firstName%", user.firstName),
                                    subject: "🚀 Welcome to Kazaswap - Dive into Our New Version!",
                                }
                                try {
                                    const r = await sendEmail({...email, contentType: "text/html"})
                                    redis.save(`launchEmailSent:${user.id}`, {email: user.email, sentAt: new Date().toISOString()})
                                    ret.push(r)

                                } catch(err) {
                                    errors.push(user)
                                }
                            }
                            response.status(200).send({success: ret, errors})
                        } else {
                            response.status(200).send(users)
                        }
                    }
                }
            },
        },
        "properties": {
            get: async (request, response) => {
                const props = await dal.find<Property>(`/items/properties?${new URLSearchParams(request.query || {}).toString()}`)
                response.status(200).send<Property[]>(props)
            },
            routes: {
                ":propId": {
                    get: async (request, response) => {
                        const {propId} = request.params
                        const prop = await dal.get<Property>(`/items/properties/${propId}?${new URLSearchParams(request.query || {}).toString()}`)
                        if(!prop) return response.status(404).send({error: "Not found"})
                        response.status(200).send<Property>(prop)
                    },
                    delete: async (request, response) => {
                        const {propId} = request.params
                        dal.delete(`/items/properties/${propId}`)
                        .then(() => response.status(200).send({}))
                        .catch((e:any) => response.status(500).send({error: e.message}))
                    },
                    routes: {
                        "verify": {
                            get: async (request, response) => {
                                let {propId} = request.params
                                if(!request.query.verify || (request.query.verify !== "true" && request.query.verify !== "false"))
                                return response.status(400).send({error: "Invalid request"})
                                dal.update<Property>(`/items/properties/${propId}`, {verified: request.query.verify === "true", private: request.query.verify !== "true"})
                                .then(p => response.status(200).send<Property>(p))
                                .catch((e:any) => response.status(500).send({error: e.message}))
                            }
                        },
                    }
                }
            }
        },
        "swaprequests": {
            get: async (request, response) => {
                const srs = await dal.find<SwapRequest>(`/items/swap_requests?${new URLSearchParams(request.query || {}).toString()}`)
                response.status(200).send(srs)
            },
            routes: {
                ":srId": {
                    get: async (request, response) => {
                        const {srId} = request.params
                        const sr = await dal.get<SwapRequest>(`/items/swap_requests/${srId}?${new URLSearchParams(request.query || {}).toString()}`)
                        if(!sr) return response.status(404).send({error: "Not found"})
                        response.status(200).send({request: sr, chat: (await getChat(srId).then(d => d.data) || [])})
                    },
                }
            }
        },
        "swaps": {
            get: async (request, response) => {
                const srs = await dal.find<Swap>(`/items/swaps?${new URLSearchParams(request.query || {}).toString()}`)
                response.status(200).send(srs)
            },
        },
        "matches": {
            get: async (request, response) => {
                const usersWithMatches = await dal.get<{user:string, count: number}[]>(`/items/matches?aggregate[count]=*&groupBy=user`)
                const search = {id: {"_in": usersWithMatches.map(u => u.user)}}
                const users = await dal.find<User>(`/items/users?limit=-1&filter=${JSON.stringify(search)}`)
                response.status(200).send(users.map(u => ({...u, matchCount: usersWithMatches.find(m => m.user === u.id)?.count || 0})))
            },
            put: async (request, response) => {
                rebuildMatches({
                    // maxSimultaneousUsers:
                    userId: request.query.userId,
                    debug: request.query.debug === "true"
                })
                .then(d => response.status(201).send(d))
                .catch((e:any) => response.status(500).send({error: e.message}))
            }
        }
        // "bubble": {
        //     routes: {
        //         "import": {
        //             get: async (request, response) => {
        //                 bubble()
        //                 .then(res => response.status(200).send(res))
        //                 .catch((e:any) => response.status(500).send({error: e.message}))
        //             }
        //         }
        //     }
        // }
    },
    middlewares: [
        auth,
        admin
    ]
}

export default route