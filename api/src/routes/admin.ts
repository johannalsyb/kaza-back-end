import { dal } from '../dal'
import { BRoute } from '../types'
import auth from '../middlewares/auth'
import User from '../../../common/src/types/User'
import { findIncompleteProfiles, markIncompleteProfiles, resetPasswordRequest, sendAccountVerifiedEmail, sendPasswordResetEmail } from '../models/user'
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
import { CreditManager, CreditLedgerEntry } from '../services/creditManager'

const route: BRoute = {
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
                        const { userId } = request.params
                        const user = await dal.get<User>(`/items/users/${userId}?${new URLSearchParams(request.query || {}).toString()}`)
                        if (!user) return response.status(404).send({ error: "Not found" })
                        response.status(200).send<User>(user)
                    },
                    delete: async (request, response) => {
                        const { userId } = request.params
                        dal.delete(`/items/users/${userId}`)
                            .then(() => response.status(200).send({}))
                            .catch((e: any) => response.status(500).send({ error: e.message }))
                    },
                    routes: {
                        "verify": {
                            get: async (request, response) => {
                                let { userId } = request.params
                                if (!request.query.verify || (request.query.verify !== "true" && request.query.verify !== "false"))
                                    return response.status(400).send({ error: "Invalid request" })

                                const url = `/items/properties?${new URLSearchParams({ filter: JSON.stringify({ owner: userId }), sort: "-createdAt" }).toString()}`
                                const props = await dal.find<Property>(url)
                                if (!props.length) {
                                    return response.status(400).send({ error: "No property for this user" })
                                }

                                try {
                                    const property = props[0]
                                    const wasVerified = !!property.verified
                                    const willVerify = request.query.verify === "true"

                                    const [updatedProp, updatedUser] = await Promise.all([
                                        dal.update<Property>(`/items/properties/${property.id}`, { verified: willVerify, private: !willVerify }),
                                        dal.update<User>(`/items/users/${userId}`, { verified: willVerify })
                                    ])

                                    if (!wasVerified && willVerify) {
                                        // User verification doesn't give credits - only property verification does
                                        // No credits update or logging needed here
                                    }

                                    await sendAccountVerifiedEmail(updatedUser)
                                    response.status(200).send<User>(updatedUser)
                                } catch (e: any) {
                                    response.status(500).send({ error: e.message })
                                }
                            }
                        },
                        "resetPassword": {
                            get: async (request, response) => {
                                let { userId } = request.params
                                const user = await dal.get<User>(`/items/users/${userId}`)
                                if (!user) return response.status(404).send({ error: "Not found" })
                                const host = getAppUrl(request)
                                sendPasswordResetEmail(user, host)
                                    .then(url => response.status(200).send({ url }))
                                    .catch((e: any) => response.status(500).send({ error: e.message }))
                            }
                        },
                    }
                },
                "incomplete": {
                    get: async (request, response) => {
                        const { action } = request.query
                        if (action === "mark") {
                            const users = await markIncompleteProfiles()
                            response.status(200).send(users)
                        } else if (action === "send") {
                            const u = await checkIncompleteProfiles()
                            response.status(200).send(u)
                        } else if (action === "find") {
                            const u = await findIncompleteProfiles()
                            response.status(200).send(u)
                        } else {
                            response.status(400).send({ error: "Invalid request" })

                        }
                    }
                },
                "importedfrombubble": {
                    get: async (request, response) => {
                        const { action } = request.query
                        const users = await dal.find<User & { launchEmailSent?: string }>(`/items/users?limit=-1&fields=id,firstName,email&filter=${JSON.stringify({ id: { "_contains": "x" } })}`)

                        for (const user of users) {
                            const sent = await redis.get(`launchEmailSent:${user.id}`) as { email: string, sentAt: string } | null
                            if (sent) {
                                user.launchEmailSent = sent.sentAt
                            }
                        }

                        if (action === "send") {
                            const host = getAppUrl(request)
                            const uusers = await Promise.all(users.map(user => resetPasswordRequest(user).then(id => ({ user, url: `${host}/resetpassword?token=${id}` }))))
                            const emailTemplate = await fs.readFile("./assets/emails/launch_reset_password.html", { encoding: "utf8" })
                            const ret = []
                            const errors = []
                            for (const { user, url } of uusers) {
                                if (user.launchEmailSent) {
                                    console.log("Already sent to", user.launchEmailSent)
                                    continue
                                }
                                const email = {
                                    to: [{ email: user.email, name: user.firstName }],
                                    content: emailTemplate.replaceAll("%url%", url).replaceAll("%firstName%", user.firstName),
                                    subject: "🚀 Welcome to Kazaswap - Dive into Our New Version!",
                                }
                                try {
                                    const r = await sendEmail({ ...email, contentType: "text/html" })
                                    redis.save(`launchEmailSent:${user.id}`, { email: user.email, sentAt: new Date().toISOString() })
                                    ret.push(r)

                                } catch (err) {
                                    errors.push(user)
                                }
                            }
                            response.status(200).send({ success: ret, errors })
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
                        const { propId } = request.params
                        const prop = await dal.get<Property>(`/items/properties/${propId}?${new URLSearchParams(request.query || {}).toString()}`)
                        if (!prop) return response.status(404).send({ error: "Not found" })
                        response.status(200).send<Property>(prop)
                    },
                    delete: async (request, response) => {
                        const { propId } = request.params
                        dal.delete(`/items/properties/${propId}`)
                            .then(() => response.status(200).send({}))
                            .catch((e: any) => response.status(500).send({ error: e.message }))
                    },
                    routes: {
                        "verify": {
                            get: async (request, response) => {
                                let { propId } = request.params
                                if (!request.query.verify || (request.query.verify !== "true" && request.query.verify !== "false"))
                                    return response.status(400).send({ error: "Invalid request" })
                                try {
                                    const property = await dal.get<Property>(`/items/properties/${propId}`)
                                    const wasVerified = !!property.verified
                                    const willVerify = request.query.verify === "true"

                                    const updated = await dal.update<Property>(`/items/properties/${propId}`, { verified: willVerify, private: !willVerify })

                                    if (!wasVerified && willVerify && property.owner) {
                                        try {
                                            // Get current user credits
                                            const currentUser = await dal.get<User>(`/items/users/${property.owner}?fields=credits`).catch(() => ({ credits: 0 }))
                                            const currentCredits = (currentUser as any)?.credits ?? 0
                                            const newCredits = currentCredits + 5

                                            // Update user credits
                                            await dal.update<User>(`/items/users/${property.owner}`, { credits: newCredits })

                                            // log signup/property verification credit
                                            await dal.create(`/items/credits_logs`, {
                                                hostId: property.owner,
                                                requesteeId: null,
                                                creditsChanged: 5,
                                                swapRequestId: null,
                                                reason: "property verification",
                                                createdAt: new Date().toISOString()
                                            })
                                            console.log(`Created credits log for property verification: ${property.owner}, credits: ${currentCredits} -> ${newCredits}`)
                                        } catch (logError) {
                                            console.error("Failed to update credits or create log:", logError)
                                        }
                                    }

                                    response.status(200).send<Property>(updated)
                                } catch (e: any) {
                                    response.status(500).send({ error: e.message })
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
                        const { srId } = request.params
                        const sr = await dal.get<SwapRequest>(`/items/swap_requests/${srId}?${new URLSearchParams(request.query || {}).toString()}`)
                        if (!sr) return response.status(404).send({ error: "Not found" })
                        response.status(200).send({ request: sr, chat: (await getChat(srId).then(d => d.data) || []) })
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
                const usersWithMatches = await dal.get<{ user: string, count: number }[]>(`/items/matches?aggregate[count]=*&groupBy=user`)
                const search = { id: { "_in": usersWithMatches.map(u => u.user) } }
                const users = await dal.find<User>(`/items/users?limit=-1&filter=${JSON.stringify(search)}`)
                response.status(200).send(users.map(u => ({ ...u, matchCount: usersWithMatches.find(m => m.user === u.id)?.count || 0 })))
            },
            put: async (request, response) => {
                rebuildMatches({
                    // maxSimultaneousUsers:
                    userId: request.query.userId,
                    debug: request.query.debug === "true"
                })
                    .then(d => response.status(201).send(d))
                    .catch((e: any) => response.status(500).send({ error: e.message }))
            }
        }
        ,
        "credits": {
            routes: {
                // New endpoint to send credits to a user
                "send": {
                    post: async (request, response) => {
                        const { userId: toUserId, credits: creditsToSend } = request.body;

                        if (!toUserId || !creditsToSend) {
                            return response.status(400).send({ error: "Missing 'userId' or 'credits' in request body" });
                        }

                        const parsedCredits = parseInt(creditsToSend);

                        // Apply the specified validation checks
                        if (parsedCredits <= 0) {
                            return response.status(400).send({ error: "Credits must be a positive number." });
                        }

                        try {
                            // Fetch the user to update
                            const user = await dal.get<User>(`/items/users/${toUserId}`);
                            if (!user) {
                                return response.status(404).send({ error: "User not found." });
                            }

                            // Calculate the new credit balance
                            const currentCredits = user.credits ?? 0;
                            const newCredits = currentCredits + parsedCredits;

                            // Prevent totals over 99
                            if (newCredits > 99) {
                                return response.status(400).send({ error: "Total credits cannot exceed 99." });
                            }

                            // Update the user's credits
                            await dal.update<User>(`/items/users/${toUserId}`, { credits: newCredits });

                            // Log the credit transaction
                            await dal.create(`/items/credits_logs`, {
                                hostId: toUserId,
                                requesteeId: request.user?.id, // Assumes the admin user is available on the request
                                creditsChanged: parsedCredits,
                                swapRequestId: null,
                                reason: "manual transfer by admin",
                                // createdAt: new Date().toISOString()
                            });

                            return response.status(200).send({
                                message: `Successfully updated user's credits. New balance: ${newCredits}`,
                                updatedUser: { id: toUserId, credits: newCredits }
                            });

                        } catch (e: any) {
                            console.error("Failed to update credits:", e);
                            return response.status(500).send({ error: e.message });
                        }
                    }
                },
                "logs": {
                    get: async (request, response) => {
                        const {
                            userFrom,
                            userTo,
                            dateFrom,
                            dateTo,
                            reason,
                            date,
                            limit = "10",
                            page = "1",
                        } = request.query

                        const filters: any = {}

                        let userFromId: string | undefined
                        let userToId: string | undefined

                        if (userFrom) {
                            const users = await dal
                                .find<Pick<User, "id" | "firstName" | "lastName">>(
                                    `/items/users?fields[]=id&fields[]=firstName&fields[]=lastName&filter=${encodeURIComponent(
                                        JSON.stringify({
                                            _or: [
                                                { firstName: { _icontains: userFrom } },
                                                { lastName: { _icontains: userFrom } },
                                            ],
                                        })
                                    )}`
                                )
                                .catch(() => [])
                            if (users.length) {
                                filters.requesteeId = { _in: users.map(u => u.id) }
                            }
                        }

                        if (userTo) {
                            const users = await dal
                                .find<Pick<User, "id" | "firstName" | "lastName">>(
                                    `/items/users?fields[]=id&fields[]=firstName&fields[]=lastName&filter=${encodeURIComponent(
                                        JSON.stringify({
                                            _or: [
                                                { firstName: { _icontains: userTo } },
                                                { lastName: { _icontains: userTo } },
                                            ],
                                        })
                                    )}`
                                )
                                .catch(() => [])
                            if (users.length) {
                                filters.hostId = { _in: users.map(u => u.id) }
                            }
                        }

                        if (userFromId) {
                            filters.requesteeId = { _eq: userFromId }
                        }

                        if (userToId) {
                            filters.hostId = { _eq: userToId }
                        }

                        if (reason) {
                            filters.reason = { _contains: reason }
                        }

                        if (date) {
                            const startOfDay = `${date}T00:00:00.000Z`
                            const endOfDay = `${date}T23:59:59.999Z`
                            filters.createdAt = { _between: [startOfDay, endOfDay] }
                        } else if (dateFrom || dateTo) {
                            filters.createdAt = {}
                            if (dateFrom) filters.createdAt._gte = dateFrom
                            if (dateTo) filters.createdAt._lte = dateTo
                        }

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
                            limit,
                            page,
                            filter: JSON.stringify(filters),
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
                            } catch { }
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

                        return response.status(200).send({
                            page: Number(page),
                            limit: Number(limit),
                            count: logs.length,
                            data: shaped,
                        })

                    }
                },
                "test-cron": {
                    post: async (request, response) => {
                        // if (!request.user || (request.user.role !== "admin" && request.user.role !== "superadmin")) {
                        //     return response.status(401).send({ error: "Unauthorized" })
                        // }

                        try {
                            // 📌 Log manual trigger by admin
                            await dal.create("/items/credits_logs", {
                                hostId: "system",             
                                requesteeId: "system",         
                                creditsChanged: 0,            
                                swapRequestId: null,
                                reason: "manual cron trigger by admin",
                                details: JSON.stringify({
                                    triggeredBy: request.user?.id || "System",
                                    triggeredAt: new Date().toISOString()
                                }),
                                createdAt: new Date().toISOString()
                            })
                            const processed = await CreditManager.processDailyCreditCron()

                            response.status(200).send({
                                message: "Test cron executed successfully",
                                processedCount: processed.length,
                                processed
                            })
                        } catch (error) {
                            console.error("Error executing test cron job:", error)
                            response.status(500).send({ error: "Failed to execute test cron job" })
                        }
                    }
                }

            }
        },
        "credits-ledger": {
            get: async (request, response) => {
                // if (!request.user || (request.user.role !== "admin" && request.user.role !== "superadmin")) {
                //     return response.status(401).send({ error: "Unauthorized" });
                // }

                const { page = 1, limit = 50, status, swapRequestId } = request.query;
                const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

                let filter: any = {};
                if (status) filter.status = status;
                if (swapRequestId) filter.swapRequestId = swapRequestId;

                const qso: any = {
                    "filter": JSON.stringify(filter),
                    "fields[]": "*",
                    "limit": limit,
                    "offset": offset,
                    "sort[]": "-createdAt"
                };

                try {
                    const ledgerEntries = await dal.find<CreditLedgerEntry>(`/items/credits_ledger?${new URLSearchParams(qso).toString()}`);
                    const total = await dal.find<CreditLedgerEntry>(`/items/credits_ledger?filter=${encodeURIComponent(JSON.stringify(filter))}&fields[]=id&limit=-1`);

                    response.status(200).send({
                        data: ledgerEntries,
                        pagination: {
                            page: parseInt(page as string),
                            limit: parseInt(limit as string),
                            total: total.length,
                            totalPages: Math.ceil(total.length / parseInt(limit as string))
                        }
                    });
                } catch (error) {
                    console.error("Error fetching credits ledger:", error);
                    response.status(500).send({ error: "Failed to fetch credits ledger" });
                }
            },
            routes: {
                "process-pending": {
                    post: async (request, response) => {
                        // if (!request.user || (request.user.role !== "admin" && request.user.role !== "superadmin")) {
                        //     return response.status(401).send({ error: "Unauthorized" });
                        // }

                        try {
                            await CreditManager.processDailyCreditCron();
                            response.status(200).send({ message: "Pending credits processed successfully" });
                        } catch (error) {
                            console.error("Error processing pending credits:", error);
                            response.status(500).send({ error: "Failed to process pending credits" });
                        }
                    }
                }
            }
        },
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