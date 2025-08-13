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
import redis, { getClient } from '../services/redis'
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

                                try {
                                    const property = props[0]
                                    const wasVerified = !!property.verified
                                    const willVerify = request.query.verify === "true"

                                    const [updatedProp, updatedUser] = await Promise.all([
                                        dal.update<Property>(`/items/properties/${property.id}`, {verified: willVerify, private: !willVerify}),
                                        dal.update<User>(`/items/users/${userId}`, {verified: willVerify})
                                    ])

                                    if (!wasVerified && willVerify) {
                                        await dal.update<User>(`/items/users/${userId}`, { credits: { _increment: 5 } as any })
                                        // log signup/property verification credit
                                        await dal.create(`/items/credits_logs`, {
                                            hostId: userId,
                                            requesteeId: null,
                                            creditsChanged: 5,
                                            swapRequestId: null,
                                            reason: "on sign up",
                                            createdAt: new Date().toISOString()
                                        })
                                    }

                                    await sendAccountVerifiedEmail(updatedUser)
                                    response.status(200).send<User>(updatedUser)
                                } catch(e:any) {
                                    response.status(500).send({error: e.message})
                                }
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
                                try {
                                    const property = await dal.get<Property>(`/items/properties/${propId}`)
                                    const wasVerified = !!property.verified
                                    const willVerify = request.query.verify === "true"

                                    const updated = await dal.update<Property>(`/items/properties/${propId}`, {verified: willVerify, private: !willVerify})

                                    if (!wasVerified && willVerify && property.owner) {
                                        await dal.update<User>(`/items/users/${property.owner}`, { credits: { _increment: 5 } as any })
                                        // log signup/property verification credit
                                        try {
                                            await dal.create(`/items/credits_logs`, {
                                                hostId: property.owner,
                                                requesteeId: null,
                                                creditsChanged: 5,
                                                swapRequestId: null,
                                                reason: "property verification",
                                                createdAt: new Date().toISOString()
                                            })
                                            console.log(`Created credits log for property verification: ${property.owner}`)
                                        } catch (logError) {
                                            console.error("Failed to create credits log:", logError)
                                        }
                                    }

                                    response.status(200).send<Property>(updated)
                                } catch (e:any) {
                                    response.status(500).send({error: e.message})
                                }
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
        ,
        "credits": {
            routes: {
                "logs": {
                    get: async (request, response) => {
                        const qso: any = {
                            sort: "-createdAt",
                            "fields[]": [
                                "id",
                                "hostId",
                                "requesteeId",
                                "creditsChanged",
                                "swapRequestId",
                                "createdAt",
                                "reason",
                                "details",
                            ],
                            limit: request.query.limit || "-1",
                        }

                        type CreditLog = {
                            id: string
                            hostId: string
                            requesteeId: string | null
                            creditsChanged: number
                            swapRequestId?: string | null
                            createdAt: string
                            reason?: string | null
                        }

                        const logs = await dal
                            .find<CreditLog>(`/items/credits_logs?${new URLSearchParams(qso).toString()}`)
                            .catch(() => [])

                        if (!logs.length) return response.status(200).send([])

                        const userIds = Array.from(
                            new Set(logs.flatMap((l) => [l.hostId, l.requesteeId]).filter(Boolean) as string[])
                        )

                        const users = await dal
                            .find<Pick<User, "id" | "firstName" | "lastName">>(
                                `/items/users?fields[]=id&fields[]=firstName&fields[]=lastName&filter=${encodeURIComponent(
                                    JSON.stringify({ id: { _in: userIds } })
                                )}`
                            )
                            .catch(() => [])

                        const idToName = new Map<string, string>()
                        for (const u of users) {
                            const name = u.firstName || u.lastName || "Unknown"
                            idToName.set(u.id, name)
                        }

                        const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
                        const formatDate = (iso: string) => {
                            const d = new Date(iso)
                            const YYYY = d.getUTCFullYear()
                            const MM = pad2(d.getUTCMonth() + 1)
                            const DD = pad2(d.getUTCDate())
                            const hh = pad2(d.getUTCHours())
                            const mm = pad2(d.getUTCMinutes())
                            const ss = pad2(d.getUTCSeconds())
                            return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`
                        }

                        const shaped = logs.map((l, idx) => {
                            const fromUserName = l.requesteeId ? idToName.get(l.requesteeId) || null : null
                            const toUserName = idToName.get(l.hostId) || "Unknown"
                            const reason = l.reason || (l.swapRequestId ? "on swap" : "on sign up")
                            let message: string | null = null
                            try {
                                const details = l as any
                                const parsed = details?.details ? JSON.parse(details.details) : null
                                if (parsed?.type === "revert") {
                                    const booked = parsed.bookedNights
                                    const stayed = parsed.stayedNights
                                    const reverted = parsed.revertBy
                                    if (typeof booked === "number" && typeof stayed === "number" && typeof reverted === "number") {
                                        const guestName = fromUserName || "Guest"
                                        message = `${guestName} stayed ${stayed} nights and booking ${booked} nights so ${reverted} credit${reverted === 1 ? "" : "s"} is revert to ${guestName}`
                                    }
                                }
                            } catch {}
                            return {
                                id: idx + 1,
                                date: formatDate(l.createdAt),
                                fromUser: fromUserName,
                                toUser: toUserName,
                                credits: l.creditsChanged,
                                reason,
                                message: message || undefined,
                            }
                        })

                        return response.status(200).send(shaped)
                    }
                }
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