import { dal } from '../dal'
import { BRoute } from '../types'
import auth from '../middlewares/auth'
import User from '../../../common/src/types/User'
import user, { countNotifications, deleteNotifications, getNotifications, getNotificationsIds, readNotifications, rotatePicture, uploadPicture } from '../models/user'
import { Api } from '../../../common/src/types/api'
import { getAppUrl } from '../utils'
import Property from '../../../common/src/types/Property'
import redis from '../services/redis'

export const findUser = async (id: string, user?: User) => {
    if (!user) return null
    if (id === "me") id = user.id
    const uu = await dal.get<User>(`/items/users/${id}`)
        .catch(err => {
            return null
        })
    if (!uu) return null

    if (uu.id !== user.id && user.role !== "admin") {
        // Hiding private info
        return {
            ...uu,
            lastName: undefined,
            email: undefined,
            phone: undefined,
            orgs: undefined,
            job: undefined,
            password: undefined,
            commsPref: undefined,
            pushToken: undefined,
        }
    } else return { ...uu, password: undefined }
}

const route: BRoute = {
    routes: {
        ":userId": {
            get: async (request, response) => {
                const { userId } = request.params
                const user = await findUser(userId, request.user)
                if (!user) return response.status(404).send({ error: "Not found" })
                response.status(200).send<Api.Users.User>({ ...user } as Api.Users.User)
            },
            patch: async (request, response) => {
                let { userId } = request.params
                if (userId === "me") userId = request.user!.id
                if (request.user?.id !== userId && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })

                let datesChanged = false
                if (request.body.dateFrom !== undefined) {
                    datesChanged = true
                    if (typeof request.body.dateFrom !== "number" && request.body.dateFrom !== null) {
                        const match = request.body.dateFrom.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)
                        if (!match) return response.status(400).send({ error: "Invalid dates format" })
                        request.body.dateFrom = new Date(request.body.dateFrom).getTime()
                    }
                } if (request.body.dateTo !== undefined && request.body.dateTo !== null) {
                    if (typeof request.body.dateTo !== "number") {
                        const match = request.body.dateTo.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)
                        if (!match) return response.status(400).send({ error: "Invalid dates format" })
                        request.body.dateTo = new Date(request.body.dateTo).getTime()
                        datesChanged = true
                    }
                }

                let emailChanged = false
                if (request.body.email && request.body.email !== request.user?.email) {
                    const users = await dal.find<User>(`/items/users?filter[email][_eq]=${request.body.email}`)
                    if (users.length)
                        return response.status(401).send({ error: "User already exists" })
                    request.body.emailVerified = false
                    emailChanged = true
                }

                let phoneChanged = false
                if (request.body.phone && request.body.phone !== request.user?.phone) {
                    request.body.phoneVerified = false
                    phoneChanged = true
                }

                let swapLocationsChanged = false
                if (request.body.swapLocations !== undefined) {
                    swapLocationsChanged = true
                }

                const userUpdate: Partial<User> = {
                    ...request.body,
                    updatedAt: new Date().toISOString()
                }
                delete userUpdate.id
                delete userUpdate.emailVerified
                delete userUpdate.phoneVerified
                delete userUpdate.role
                delete userUpdate.verified
                delete userUpdate.createdAt
                delete userUpdate.orgs
                delete userUpdate.password

                const uu = await dal.update<User>(`/items/users/${userId}`, userUpdate)

                const promises = []
                const host = getAppUrl(request)
                if (emailChanged) {
                    promises.push(user.email.sendVerifyEmail(uu, host))
                }

                if (phoneChanged) {
                    promises.push(user.phone.sendVerifySms(uu))
                }

                if (swapLocationsChanged || datesChanged) {
                    const properties = await dal.find<Property>(`/items/properties?filter[owner][_eq]=${userId}`)
                    for (const p of properties) {
                        promises.push(redis.remove(`marker:${p.id}`))
                    }
                }
                await Promise.all(promises)
                response.status(200).send<Api.Users.Update>({ ...uu, password: undefined } as Api.Users.Update)
            },
            routes: {
                "pictures": {
                    post: async (request, response) => {
                        let { userId } = request.params
                        if (userId === "me") userId = request.user!.id
                        if (request.user?.id !== userId && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })
                        if (!request.body.files || !request.body.files.length) return response.status(400).send({ error: "No files" })
                        const files = request.body.files as string[]
                        const imageId = await uploadPicture(userId, files[0])
                        response.status(200).send<Api.Users.Pictures>({ images: [imageId] })
                    },
                    patch: async (request, response) => {
                        let { userId } = request.params
                        if (userId === "me") userId = request.user!.id
                        if (request.user?.id !== userId && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })
                        const user = await findUser(userId, request.user)
                        const imageId = await rotatePicture(user!.id, user!.primaryImage, request.query.rotation ? parseInt(request.query.rotation || "90") : 90)
                        response.status(200).send<Api.Users.Pictures>({ images: [imageId] })
                    }
                },
                "notifications": {
                    get: async (request, response) => {
                        let { userId } = request.params
                        let id = userId === "me" ? request.user!.id : userId

                        if (request.user?.id !== id && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })

                        console.log('request.query.read', request.query )
                        const notifications = await getNotifications(id, request.query.read === "true")
                        console.log('notifications', notifications)
                        // 
                        //     response.status(200).send(notifications)
                        response.status(200).send([])
                    },
                    patch: async (request, response) => {
                        let { userId } = request.params
                        if (userId === "me") userId = request.user!.id
                        if (request.user?.id !== userId && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })
                        const nids = await getNotificationsIds(userId, false)
                        await readNotifications(userId, ...nids)
                        response.status(200).send(nids)
                    },
                    routes: {
                        "count": {
                            get: async (request, response) => {
                                let { userId } = request.params
                                if (userId === "me") userId = request.user!.id
                                if (request.user?.id !== userId && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })
                                const notifications = await countNotifications(userId, request.query.read === "true")
                                response.status(200).send({ count: notifications })
                            }
                        },
                        ":notId": {
                            patch: async (request, response) => {
                                let { userId, notId } = request.params
                                if (userId === "me") userId = request.user!.id
                                if (request.user?.id !== userId && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })
                                await readNotifications(userId, notId)
                                response.status(200).send("success")
                            },
                            delete: async (request, response) => {
                                let { userId, notId } = request.params
                                if (userId === "me") userId = request.user!.id
                                if (request.user?.id !== userId && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })
                                await deleteNotifications(userId, notId)
                                response.status(200).send("success")
                            },
                        }
                    }
                },
                "requestVerify": {
                    get: async (request, response) => {
                        const { type } = request.query
                        if (type !== "phone" && type !== "email") return response.status(400).send({ error: "Invalid request" })
                        let { userId } = request.params
                        if (userId === "me") userId = request.user!.id
                        if (request.user?.id !== userId && request.user?.role !== "admin") return response.status(401).send({ error: "Unauthorized" })
                        const uu = await dal.get<User>(`/items/users/${userId}`).catch(err => null)
                        if (!uu) return response.status(401).send({ error: "Unauthorized" })
                        const host = getAppUrl(request)
                        let promise: Promise<string>
                        if (type === "email") promise = user.email.sendVerifyEmail(uu, host)
                        else if (type === "phone") promise = user.phone.sendVerifySms(uu).then(arr => arr[0])
                        else return response.status(400).send({ error: "Invalid request" })

                        promise.then(u => {
                            response.status(200).send("success")
                        })
                            .catch(err => {
                                response.status(500).send({ error: err.message || err })
                            })
                    }
                }
            }
        },
    },
    middlewares: [
        auth
    ]
}

export default route
