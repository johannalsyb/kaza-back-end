import { dal } from '../dal'
import { BRoute } from '../types'
import auth from '../middlewares/auth'
import { Swap } from '../../../common/src/types/Swap'
import { Chat, SwapRequest } from '../../../common/src/types/SwapRequest'
import { Api, User } from '../../../common/src'
import Property from '../../../common/src/types/Property'
import { addChatMessage, findNewMessageScheduledNotificationForUser, getChatUrl, getScheduledNotificationId } from '../models/swapRequest'
import notification, { deleteScheduled } from "../utils/notifications"
import { getAppUrl } from '../utils'
import { publicPropertyWithOwnerFields } from './properties'

import stream from 'stream'
import { randomUUID } from 'crypto'
import Temp from '../../../common/src/types/Temp'
import { WS_URL } from '../config'
import redis from '../services/redis'

type WSToken = {
    id: string,
    user: string,
    type: "chat-token",
    expiry: number,
    data: string,
}

const propertyFields = publicPropertyWithOwnerFields
const swapRequestFields = [
    "*",
    ...propertyFields.map(f => `fromProperty.${f}`),
    ...propertyFields.map(f => `toProperty.${f}`),
]

const swapFields = [
    "*",
    ...swapRequestFields.slice(1).map(f => `request.${f}`),
    "request.id",
    "request.from",
    "request.to",
    "request.fromAccepted",
    "request.toAccepted",
    "request.createdAt",
    "request.updatedAt",
    "request.fromProperty.address",
    "request.fromProperty.lat",
    "request.fromProperty.lon",
    "request.toProperty.address",
    "request.toProperty.lat",
    "request.toProperty.lon",
]

const route: BRoute = {
    get: async (request, response) => {
        const u = request.user!
        const sr = await dal.find<SwapRequest>(`/items/swap_requests?fields[]=id&filter=${JSON.stringify({ "_or": [{ "from": u.id }, { "to": u.id }] })}`)
        if (!sr.length) return response.status(200).send([])
        const qso: any = {
            "filter": JSON.stringify({ "request": { "_in": sr.map(s => s.id) } }),
            "fields[]": swapFields
        }
        const swaps = await dal.find<Api.Swaps.Swap>(`/items/swaps?${new URLSearchParams(qso).toString()}`)
        response.status(200).send(swaps)
    },
    routes: {
        "requests": {
            get: async (request, response) => {
                const u = request.user!

                const qso: any = {
                    "filter": JSON.stringify({ "_and": [{ "_or": [{ "from": u.id }, { "to": u.id }] }, /*{"status": "pending"}*/] }),
                    "fields[]": swapRequestFields
                }

                const sr = await dal.find<Api.Swaps.SwapRequest>(`/items/swap_requests?${new URLSearchParams(qso).toString()}`)
                const newMessageScheduledNotifications = await findNewMessageScheduledNotificationForUser(u.id)
                sr.forEach(s => {
                    s.newMessage = newMessageScheduledNotifications.find(n => n.id === getScheduledNotificationId(u.id, s.id)) ? 1 : 0
                })
                response.status(200).send(sr)
            },
            post: async (request, response) => {
                const u = request.user!
                const {
                    fromPropertyId,
                    toPropertyId,
                } = request.body
                if (!toPropertyId) return response.status(400).send({ error: "Missing data" })

                const fuser = await dal.get<Partial<User>>(`/items/users/${u.id}?fields=verified,firstName`)
                if (!fuser || !fuser.verified) return response.status(400).send({ error: "User not verified" })

                let fromProperty: Property | null = null
                if (!fromPropertyId) {
                    fromProperty = (await dal.find<Property>(`/items/properties?filter=${JSON.stringify({ owner: u.id })}`))[0]
                } else {
                    if (fromPropertyId === toPropertyId) return response.status(400).send({ error: "Cannot swap with the same property" })
                    fromProperty = await dal.get<Property>(`/items/properties/${fromPropertyId}`).catch(err => null)
                }
                if (!fromProperty) return response.status(400).send({ error: "Invalid property (from)" })
                if (fromProperty.owner !== u.id) return response.status(400).send({ error: "Invalid property" })
                if (!fromProperty.verified) return response.status(400).send({ error: "Cannot swap with unverified properties (from)" })
                if (fromProperty.private) return response.status(400).send({ error: "Cannot swap with private properties" })

                const toProperty = await dal.get<Property>(`/items/properties/${toPropertyId}`).catch(err => null)
                if (!toProperty) return response.status(400).send({ error: "Invalid property (to)" })
                if (toProperty.owner === u.id) return response.status(400).send({ error: "Cannot swap with your own property" })
                if (toProperty.private) return response.status(400).send({ error: "Cannot swap with private properties" })
                if (!toProperty.verified) return response.status(400).send({ error: "Cannot swap with unverified properties (to)" })

                /* Note: We can receive swap requests even if we are not verified, but we can't accept them until we are */
                // const tuser = await dal.get<Partial<User>>(`/items/users/${toProperty.owner}?fields=verified`)
                // if(!tuser || !tuser.verified) return response.status(400).send({error: "User not verified"})

                // Nights requested for this swap
                const nightsRaw = request.body?.nights
                const nights = Math.max(
                    1,
                    typeof nightsRaw === "number" ? nightsRaw : (parseInt(nightsRaw || "1", 10) || 1)
                )

                // Check availability on target property (best-effort based on dateDuration text)
                const inferAvailableNights = (p: Property): number | null => {
                    try {
                        if (p.dateDuration && typeof p.dateDuration === "string") {
                            // Try ranges like "3-5", "3 to 5"
                            const range = p.dateDuration.match(/(\d+)\s*(?:-|to)\s*(\d+)/i)
                            if (range) return parseInt(range[2]!, 10)
                            const single = p.dateDuration.match(/\d+/)
                            if (single) return parseInt(single[0]!, 10)
                        }
                    } catch {}
                    return null
                }
                const availableNights = inferAvailableNights(toProperty)
                if (availableNights !== null && nights > availableNights) {
                    return response.status(400).send({
                        error: "Requested nights exceed property's available duration",
                        requested: nights,
                        available: availableNights,
                    })
                }

                // Ensure requester has enough credits at request time
                const requester = await dal.get<Partial<User>>(`/items/users/${u.id}?fields=credits`).catch(err => null)
                const availableCredits = (requester as any)?.credits ?? 0
                if (availableCredits < nights) {
                    return response.status(400).send({ error: "Insufficient credits", required: nights, available: availableCredits })
                }

                const qso = {
                    filter: JSON.stringify({
                        "_and": [
                            { "fromProperty": fromProperty.id },
                            { "toProperty": toProperty.id },
                            {
                                "_or": [
                                    { "fromAccepted": { "_null": true } },
                                    { "toAccepted": { "_null": true } }
                                ]
                            },
                            { "status": "pending" }
                        ]
                    })
                }
                const usp = new URLSearchParams(qso).toString()
                const existing = await dal.find<SwapRequest>(`/items/swap_requests?${usp}`)
                if (existing.length) return response.status(400).send({ error: "Swap request already exists" })
                const data = {
                    from: u.id,
                    to: toProperty.owner,
                    fromProperty: fromProperty.id,
                    toProperty: toProperty.id,
                    createdAt: new Date().toISOString()
                }
                const sr = await dal.create<SwapRequest>(`/items/swap_requests`, data)

                await notification({
                    from: u.id,
                    to: toProperty.owner,
                    type: "swaprequest_new",
                    title: "New Swap Request",
                }, {
                    url: `${getAppUrl(request)}/chats/${sr.id}`,
                    user: fuser.firstName,
                    location: fromProperty.city || fromProperty.country
                })

                response.status(200).send(sr)
            },
            routes: {
                "history": {
                    get: async (request, response) => {
                        const u = request.user!

                        const qso: any = {
                            "filter": JSON.stringify({ "_and": [{ "_or": [{ "from": u.id }, { "to": u.id }] }, { "status": { "_neq": "pending" } }] }),
                            "fields[]": swapRequestFields
                        }

                        const sr = await dal.find<Api.Swaps.SwapRequest>(`/items/swap_requests?${new URLSearchParams(qso).toString()}`)
                        response.status(200).send(sr)
                    },
                },
                ":swapRequestId": {
                    get: async (request, response) => {
                        const u = request.user!
                        const { swapRequestId } = request.params
                        const qso = new URLSearchParams({ "fields[]": swapRequestFields } as any).toString()
                        const sr = await dal.get<Api.Swaps.SwapRequest>(`/items/swap_requests/${swapRequestId}?${qso}`).catch(err => null)
                        if (!sr || (sr.from !== u.id && sr.to !== u.id)) return response.status(404).send({ error: "Not found" })
                        response.status(200).send(sr)
                    },
                    routes: {
                        "chat": {
                            get: async (request, response) => {
                                const u = request.user!
                                const { swapRequestId } = request.params
                                const sr = await dal.get<SwapRequest>(`/items/swap_requests/${swapRequestId}?fields=from,to`).catch(err => null)
                                if (!sr || (sr.from !== u.id && sr.to !== u.id)) return response.status(404).send({ error: "Not found" })
                                const url = await getChatUrl(swapRequestId)
                                if (!url) return response.status(201).send<Chat>([])
                                else {
                                    try {
                                        const stream = (await fetch(url)).body
                                        if (!stream) return response.status(500).send({ error: "Error fetching chat" })
                                        return response.pipe(200, stream)
                                        // return response.redirect(302, url)
                                    } catch (err) {

                                    }
                                }
                            },
                            post: async (request, response) => {
                                const u = request.user!
                                const { swapRequestId } = request.params
                                const { message, attachments } = request.body
                                if ((!message || !message.length) && (!attachments || !attachments.length)) return response.status(400).send({ error: "Empty message" })
                                const sr = await dal.get<SwapRequest>(`/items/swap_requests/${swapRequestId}?fields=from,to`).catch(err => null)
                                if (!sr || (sr.from !== u.id && sr.to !== u.id)) return response.status(404).send({ error: "Not found" })
                                const cm = await addChatMessage({
                                    swapRequestId,
                                    message: {
                                        from: u.id,
                                        to: sr.from === u.id ? sr.to : sr.from,
                                        message,
                                        attachments
                                    },
                                    sendNotification: true
                                })

                                response.status(200).send(cm)
                            },
                            websocket: async (request, socket) => {

                                socket.on("close", (n) => {
                                    console.log("socket closed", n)
                                })

                                if (!request.query.token) return socket.close(-1)
                                const uuid = request.query.token
                                // const temp = await dal.get<Temp>(`/items/temp/${uuid}?fields=data,type,expiry`).catch(err => null)
                                const temp = await redis.get(`chat:${uuid}`).catch(err => null) as WSToken
                                if (!temp || temp.type !== "chat-token" || temp.expiry < Date.now()) return socket.close(-2)
                                if (temp.data !== request.params.swapRequestId) return socket.close(-3)
                                await dal.delete(`/items/temp/${uuid}`).catch(err => null)
                                if (temp.user) {
                                    const scheduledNotfificationId = getScheduledNotificationId(temp.user, request.params.swapRequestId)
                                    deleteScheduled(scheduledNotfificationId)
                                        .catch(err => null)
                                }

                                const substr = redis.pubsub.subscribe(`chat:${request.params.swapRequestId}`, (message, _channel) => {
                                    socket.send(message)
                                }).then(subscriptionId => {
                                    socket.on("close", (n) => {
                                        redis.pubsub.unsubscribe(subscriptionId)
                                    })
                                })

                                // socket.on("message", async (message) => {
                                //     // DO NOTHING
                                // })
                            },
                            routes: {
                                "ws": {
                                    get: async (request, response) => {
                                        try {
                                            const u = request.user!
                                            const { swapRequestId } = request.params
                                            const sr = await dal.get<SwapRequest>(`/items/swap_requests/${swapRequestId}?fields=from,to`).catch(err => null)
                                            if (!sr || (sr.from !== u.id && sr.to !== u.id)) return response.status(404).send({ error: "Not found" })
                                            const uuid = randomUUID()
                                            const wsToken: WSToken = {
                                                id: uuid,
                                                user: u.id,
                                                type: "chat-token",
                                                expiry: Date.now() + 1000 * 60 * 1, // 1 minute
                                                data: swapRequestId,
                                            }
                                            await redis.save(`chat:${uuid}`, wsToken, undefined, 60 * 1)
                                            const url = `${WS_URL}/swaps/requests/${swapRequestId}/chat?token=${uuid}`
                                            return response.status(200).send({ url })
                                            // return response.redirect(302, url)
                                        } catch (err) {
                                            return response.status(500).send({ error: "Error creating chat feed" })
                                        }
                                    }
                                }
                            }
                        },
                        "accept": {
                            get: async (request, response) => {
                                const u = request.user!
                                const { swapRequestId } = request.params
                                const sr = await dal.get<SwapRequest>(`/items/swap_requests/${swapRequestId}`).catch(err => null)
                                if (!sr || (sr.from !== u.id && sr.to !== u.id)) return response.status(404).send({ error: "Not found" })

                                /* Note: We can't accept if we are not verified */
                                const fuser = await dal.get<Partial<User>>(`/items/users/${u.id}?fields=verified`)
                                if (!fuser || !fuser.verified) return response.status(400).send({ error: "User not verified" })

                                if (sr.status !== "pending") {
                                    return response.status(400).send({ error: "Request already processed" })
                                }
                                // If this acceptance would finalize the swap (other side already accepted),
                                // ensure the requestee has enough credits for the requested nights
                                {
                                    const otherSideAlreadyAccepted = sr.from === u.id ? !!sr.toAccepted : !!sr.fromAccepted
                                    if (otherSideAlreadyAccepted) {
                                        const nightsRaw = (sr as any).nights
                                        const nights = Math.max(
                                            1,
                                            typeof nightsRaw === "number" ? nightsRaw : (parseInt(nightsRaw || "1", 10) || 1)
                                        )
                                        // Requestee is the user who initiated the request (`from`)
                                        const requestee = await dal.get<Partial<User>>(`/items/users/${sr.from}?fields=credits`).catch(err => null)
                                        const availableCredits = (requestee as any)?.credits ?? 0
                                        if (availableCredits < nights) {
                                            return response.status(400).send({ error: "Insufficient credits", required: nights, available: availableCredits })
                                        }
                                    }
                                }
                                if (sr.from === u.id) {
                                    if (sr.fromAccepted) return response.status(400).send({ error: "Already accepted" })
                                    sr.fromAccepted = new Date().toISOString()
                                } else {
                                    if (sr.toAccepted) return response.status(400).send({ error: "Already accepted" })
                                    sr.toAccepted = new Date().toISOString()
                                }
                                sr.updatedAt = new Date().toISOString()
                                let up = await dal.update<SwapRequest>(`/items/swap_requests/${swapRequestId}`, sr)

                                if (sr.fromAccepted && sr.toAccepted) {
                                    const swap = await dal.create<Swap>(`/items/swaps`, {
                                        request: sr.id,
                                    })
                                    sr.updatedAt = new Date().toISOString()
                                    up = await dal.update<SwapRequest>(`/items/swap_requests/${swapRequestId}`, { id: sr.id, status: "accepted" })

                                    const nightsRaw = (sr as any).nights
                                    const nights = Math.max(
                                        1,
                                        typeof nightsRaw === "number" ? nightsRaw : (parseInt(nightsRaw || "1", 10) || 1)
                                    )

                                    // Host gets credits
                                    await dal.update<User>(`/items/users/${sr.to}`, {
                                        credits: { _increment: nights } as any
                                    });

                                    // Requestee loses credits
                                    await dal.update<User>(`/items/users/${sr.from}`, {
                                        credits: { _decrement: nights } as any
                                    });


                                    // log credit changes (so frontend can show it)
                                    await dal.create(`/items/credits_logs`, {
                                        hostId: sr.to,
                                        requesteeId: sr.from,
                                        creditsChanged: nights,
                                        swapRequestId: sr.id,
                                        reason: "on swap",
                                        details: JSON.stringify({ type: "swap_finalize", nights }),
                                        createdAt: new Date().toISOString()
                                    });

                                    await Promise.all([
                                        notification({
                                            to: u.id,
                                            from: sr.from,
                                            type: "swaprequest_accepted",
                                            title: "Swap Request Accepted"
                                        }, {
                                            url: `${getAppUrl(request)}/chats/${swap.id}`
                                        }),
                                        notification({
                                            to: sr.from,
                                            from: u.id,
                                            type: "swaprequest_accepted",
                                            title: "Swap Request Accepted"
                                        }, {
                                            url: `${getAppUrl(request)}/chats/${swap.id}`
                                        })
                                    ])
                                }

                                await addChatMessage({
                                    swapRequestId,
                                    message: {
                                        from: u.id,
                                        to: sr.from === u.id ? sr.to : sr.from,
                                        message: "",
                                        type: "accepted",
                                    }
                                }).catch(err => null)

                                response.status(200).send(up)
                            }
                        },
                        "revert": {
                            post: async (request, response) => {
                                const u = request.user!
                                const { swapRequestId } = request.params
                                const sr = await dal.get<SwapRequest>(`/items/swap_requests/${swapRequestId}`).catch(err => null)
                                if (!sr || (sr.from !== u.id && sr.to !== u.id && u.role !== "admin")) return response.status(404).send({ error: "Not found" })

                                // Only host or admin can initiate a revert
                                const isHost = u.id === sr?.to
                                const isAdmin = u.role === "admin" || u.role === "superadmin"
                                if (!(isHost || isAdmin)) return response.status(401).send({ error: "Unauthorized" })

                                // Determine booked nights on the swap
                                const nightsRaw = (sr as any).nights
                                const bookedNights = Math.max(
                                    1,
                                    typeof nightsRaw === "number" ? nightsRaw : (parseInt(nightsRaw || "1", 10) || 1)
                                )

                                // Calculate previously reverted credits for this swap
                                type CreditLog = { creditsChanged: number }
                                const revertedLogs = await dal.find<CreditLog>(
                                    `/items/credits_logs?filter=${encodeURIComponent(JSON.stringify({ swapRequestId: sr.id, reason: "revert" }))}&fields[]=creditsChanged&limit=-1`
                                ).catch(() => [])
                                const alreadyReverted = revertedLogs
                                    .map(l => (l.creditsChanged < 0 ? -l.creditsChanged : 0))
                                    .reduce((a, b) => a + b, 0)

                                // Read input: either stayedNights or revertBy
                                const stayedNightsRaw = request.body?.stayedNights
                                const revertByRaw = request.body?.revertBy

                                let revertBy = 0
                                if (stayedNightsRaw !== undefined && stayedNightsRaw !== null) {
                                    const used = Math.max(0, typeof stayedNightsRaw === "number" ? stayedNightsRaw : (parseInt(stayedNightsRaw, 10) || 0))
                                    revertBy = Math.max(0, bookedNights - used - alreadyReverted)
                                } else if (revertByRaw !== undefined && revertByRaw !== null) {
                                    revertBy = Math.max(0, typeof revertByRaw === "number" ? revertByRaw : (parseInt(revertByRaw, 10) || 0))
                                }

                                const remainingToRevert = Math.max(0, bookedNights - alreadyReverted)
                                if (revertBy <= 0) return response.status(400).send({ error: "Invalid revert amount" })
                                if (revertBy > remainingToRevert) return response.status(400).send({ error: "Revert exceeds remaining nights", remaining: remainingToRevert })

                                // Ensure host has enough credits to give back
                                const host = await dal.get<Partial<User>>(`/items/users/${sr.to}?fields=credits`).catch(err => null)
                                const hostCredits = (host as any)?.credits ?? 0
                                if (hostCredits < revertBy) {
                                    return response.status(400).send({ error: "Host has insufficient credits to revert", required: revertBy, available: hostCredits })
                                }

                                // Perform transfers: host -revertBy, requestee +revertBy
                                await dal.update<User>(`/items/users/${sr.to}`, {
                                    credits: { _decrement: revertBy } as any
                                })
                                await dal.update<User>(`/items/users/${sr.from}`, {
                                    credits: { _increment: revertBy } as any
                                })

                                // Log revert as negative on host side
                                await dal.create(`/items/credits_logs`, {
                                    hostId: sr.to,
                                    requesteeId: sr.from,
                                    creditsChanged: -revertBy,
                                    swapRequestId: sr.id,
                                    reason: "revert",
                                    details: JSON.stringify({ type: "revert", bookedNights, stayedNights: (stayedNightsRaw ?? null), revertBy }),
                                    createdAt: new Date().toISOString()
                                })

                                return response.status(200).send({ reverted: revertBy, remaining: remainingToRevert - revertBy })
                            }
                        },
                        "decline": {
                            patch: async (request, response) => {
                                const u = request.user!
                                const { swapRequestId } = request.params
                                const { note } = request.body
                                const sr = await dal.get<SwapRequest>(`/items/swap_requests/${swapRequestId}`).catch(err => null)
                                if (!sr || (sr.from !== u.id && sr.to !== u.id)) return response.status(404).send({ error: "Not found" })
                                if (sr.fromAccepted && sr.toAccepted)
                                    return response.status(400).send({ error: "Already accepted" })
                                if (sr.status === "declined")
                                    return response.status(400).send({ error: "Already declined" })

                                const nnotes = [...JSON.parse(sr.notes || "[]"), { at: new Date().toISOString(), declinedBy: u.id }]
                                if (note) nnotes.push({ at: new Date().toISOString(), from: u.id, note })

                                const up = await dal.update<SwapRequest>(`/items/swap_requests/${swapRequestId}`, {
                                    id: sr.id,
                                    status: "declined",
                                    notes: JSON.stringify(nnotes)
                                })

                                await notification({
                                    to: sr.from === u.id ? sr.to : sr.from,
                                    type: "swaprequest_declined",
                                    title: "Swap Request Declined",
                                    from: u.id
                                }, {
                                    url: `${getAppUrl(request)}/chats/${swapRequestId}`
                                })

                                await addChatMessage({
                                    swapRequestId,
                                    message: {
                                        from: u.id,
                                        to: sr.from === u.id ? sr.to : sr.from,
                                        message: note,
                                        type: "declined",
                                    }
                                }).catch(err => null)

                                response.status(200).send(up)
                            }
                        },
                        "swap": {
                            get: async (request, response) => {
                                const u = request.user!
                                const { swapRequestId } = request.params

                                const qso: any = {
                                    "fields[]": swapFields,
                                    "filter": JSON.stringify({ "request": swapRequestId })
                                }
                                const swaps = await dal.find<Api.Swaps.Swap>(`/items/swaps/?${new URLSearchParams(qso).toString()}`)
                                if (!swaps.length) return response.status(404).send({ error: "Not found" })
                                const sr = swaps[0]
                                if (!sr || (sr.request.from !== u.id && sr.request.to !== u.id)) return response.status(404).send({ error: "Not found" })

                                response.status(200).send(sr)
                            }
                        },
                    }
                }
            }
        },
        ":swapId": {
            get: async (request, response) => {
                const { swapId } = request.params
                const u = request.user!
                const qso: any = {
                    "fields[]": swapFields
                }
                const swap = await dal.get<Api.Swaps.Swap>(`/items/swaps/${swapId}?${new URLSearchParams(qso).toString()}`)
                    .catch(err => null)

                if (!swap) return response.status(404).send({ error: "Not found" })
                if (swap.request.from !== u.id && swap.request.to !== u.id)
                    return response.status(404).send({ error: "Not found" })
                response.status(200).send(swap)
            },
        },
    },
    middlewares: [auth]
}

export default route
