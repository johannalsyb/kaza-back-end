import User from '../../../common/src/types/User'
import Temp from '../../../common/src/types/Temp'
import { AUTH_COOKIE, GOOGLE_CLIENT_ID } from '../config'
import { dal } from '../dal'
import auth, { encrypt, getUserFromRequest } from '../middlewares/auth'
import { BRoute } from '../types'
import crypto, { randomUUID } from "crypto"

import { Api } from '../../../common/src/types/api'
import Users, { countNewMatches, countNotifications, findById, findByEmail, sendPasswordResetEmail } from '../models/user'
import { getAppUrl, getFEAppUrl } from '../utils'
import stripe from '../utils/payments/stripe'
import redis from '../services/redis'
import { OAuth2Client } from 'google-auth-library'

export const hash = (password: string) => {
    const hash = crypto.createHash('sha512')
    const data = hash.update(password, 'utf-8')
    return data.digest('base64')
}
const client = new OAuth2Client(GOOGLE_CLIENT_ID)

const route: BRoute = {
    routes: {
        "login": {
            post: async (request, response) => {
                const { email, password } = request.body

                const fromSite = request.headers?.origin || (request.headers?.referer || "")
                let sameSite = "Strict"
                if (fromSite.startsWith("http://localhost")) sameSite = "None"

                if (!email || !password || !email.length || !password.length)
                    return response.status(400).send({ error: "Missing email or password" })

                const users = await findByEmail(email)

                if (!users.length)
                    return response.status(401).send({ error: "Invalid credentials" })
                const user = users[0]
                if (user.password !== hash(password))
                    return response.status(401).send({ error: "Invalid credentials" })

                const jwt = encrypt(user)
                if (!jwt)
                    return response.status(500).send({ error: "Internal error" })

                response.headers = { ...response.headers, "Set-Cookie": `${AUTH_COOKIE}=${jwt}; Path=/; ${sameSite === "None" ? "" : "HttpOnly;"} SameSite=${sameSite}; ${sameSite === "None" ? "Secure; " : ""}Max-Age=31536000;` }
                response.status(200).send({ ...user, password: undefined, token: jwt })
            }
        },
        "signup": {
            post: async (request, response) => {
                const { email, password, firstName, lastName, phone, gender, onboarding } = request.body
                if (
                    !email ||
                    !password ||
                    !password.length ||
                    !email.length ||
                    !firstName ||
                    !firstName.length ||
                    // !lastName ||
                    // !lastName.length ||
                    !phone ||
                    !phone.length
                )
                    return response.status(400).send({ error: "Missing data" })

                const users = await findByEmail(email)
                
                // Check if user exists with same email but different phone number
                if (users.length > 0) {
                    const existingUser = users[0]
                    
                    // If phone number is different and the existing user's phone is not verified, delete the old account
                    if (existingUser.phone !== phone && !existingUser.phoneVerified) {
                        console.log(`Deleting unverified account for email ${email} with old phone ${existingUser.phone} and creating new account with phone ${phone}`)
                        
                        // Clean up any pending phone verification codes for the old user
                        try {
                            const keys = await redis.keys(`phone:*`)
                            for (const key of keys) {
                                const userData = await redis.get(key)
                                if (userData && userData.id === existingUser.id) {
                                    await redis.remove(key)
                                    console.log(`Cleaned up phone verification code for user ${existingUser.id}`)
                                }
                            }
                        } catch (error) {
                            console.error('Error cleaning up phone verification codes:', error)
                        }
                        
                        // Clean up any pending email verification tokens for the old user
                        try {
                            const tempItems = await dal.find(`/items/temp?filter=${JSON.stringify({ type: "verifyemail", data: existingUser.id })}`)
                            for (const temp of tempItems) {
                                await dal.delete(`/items/temp/${temp.id}`)
                                console.log(`Cleaned up email verification token for user ${existingUser.id}`)
                            }
                        } catch (error) {
                            console.error('Error cleaning up email verification tokens:', error)
                        }
                        
                        await dal.delete(`/items/users/${existingUser.id}`)
                    } else if (existingUser.phone === phone) {
                        // Same email and same phone number - user already exists
                        return response.status(401).send({ error: "User already exists" })
                    } else if (existingUser.phoneVerified) {
                        // Phone is verified, cannot replace account
                        return response.status(401).send({ error: "User already exists with verified phone number" })
                    }
                }
                
                const user = await dal.create<User>(`/items/users`, {
                    email,
                    password: hash(password),
                    firstName,
                    lastName,
                    phone,
                    gender,
                    onboarding,
                    createdAt: new Date().toISOString()
                })

                const host = getAppUrl(request)
                const feAppEndpoint=getFEAppUrl(request)
                Promise.all([
                    Users.email.sendVerifyEmail(user, feAppEndpoint),
                    Users.phone.sendVerifySms(user)
                ])
                    .catch(err => console.error(err))
                response.status(200).send({ ...user, password: undefined } as Api.Auth.Me)
            }
        },
        "logout": {
            get: (request, response) => {
                response.headers = { ...response.headers, "Set-Cookie": `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;` }
                response.status(200).send("success")
            },
            middlewares: [auth]
        },
        "me": {
            get: async (request, response) => {
                const user = await dal.get<User>(`/items/users/${request.user?.id}`)
                const unreadNotifications = await countNotifications(user.id, false).catch(err => 0)
                const newMatches = await countNewMatches(user.id).catch(err => 0)
                response.status(200).send({
                    ...user,
                    password: undefined,
                    unreadNotifications,
                    newMatches
                } as Api.Auth.Me)
            },
            middlewares: [auth]
        },
        "verify": {
            get: async (request, response) => {
                const { token, code } = request.query
                try {
                    let status = 200
                    let message = "Success"
                    if (token) { // This is for email verification
                        const valid = await Users.email.verifyEmail(token)
                        status = valid[0]
                        message = valid[1]
                    } else if (code) { // This is for phone verification
                        const valid = await Users.phone.verify(code)
                        if (!valid) {
                            status = 400
                            message = "Invalid code"
                        }
                    }
                    if (status !== 200) throw [status, message]
                    response.status(200).send<Api.Auth.Verify>({ message: "Success" })
                } catch (err) {
                    const e = Array.isArray(err) ? err : [500, "Internal error"]
                    return response.status(e[0]).send({ error: e[1] })
                }
            }
        },
        "reset": {
            get: async (request, response) => {
                const { email, token } = request.query
                if (token) {
                    const temp = await dal.get<Temp>(`/items/temp/${token}`)
                    if (!temp)
                        return response.status(404).send({ error: "Invalid token" })
                    if (temp.type !== "resetpassword")
                        return response.status(404).send({ error: "Invalid token" })
                    if (temp.expiry < Date.now()) {
                        await dal.delete(`/items/temp/${token}`)
                        return response.status(404).send({ error: "Invalid token" })
                    }
                    return response.status(200).send<Api.Auth.ResetPassword>({ message: "Success" })
                } else if (email) {
                    if (!email || !email.length)
                        return response.status(400).send({ error: "Missing data" })

                    const users = await findByEmail(email)
                    if (!users.length)
                        return response.status(200).send({ message: "Success" }) // We pretend it's a success to avoid leaking emails

                    const user = users[0]
                    const host = getAppUrl(request)
                    await sendPasswordResetEmail(user, host)

                    return response.status(200).send<Api.Auth.ResetPassword>({ message: "Success" })
                }
                return response.status(400).send({ error: "Invalid request" })
            },
            post: async (request, response) => {
                const { token, password } = request.body

                const temp = await dal.get<Temp>(`/items/temp/${token}`)
                if (!temp)
                    return response.status(404).send({ error: "Invalid token" })
                if (temp.type !== "resetpassword")
                    return response.status(404).send({ error: "Invalid token" })
                if (temp.expiry < Date.now())
                    return response.status(404).send({ error: "Invalid token" })

                const user = await dal.get<User>(`/items/users/${temp.data}`)
                if (!user)
                    return response.status(404).send({ error: "Invalid token" })

                await dal.delete(`/items/temp/${token}`)
                await dal.update<User>(`/items/users/${user.id}`, { password: hash(password) })

                response.status(200).send<Api.Auth.ResetPassword>({ message: "Success" })
            },
        },
        "checkout": {
            post: async (request, response) => {
                try {
                    const domain = getAppUrl(request)
                    let priceId = "price_1PYPXyCdvZbuHRnNp3VLBH64" // Test
                    if (domain.includes("https://app.kazaswap.co")) {
                        priceId = "price_1PYPVRCdvZbuHRnNNBkhsK7s" // Production
                    }
                    const return_url = `${domain}/payments/return.html?session_id={CHECKOUT_SESSION_ID}`
                    const session = await stripe().checkout.sessions.create({
                        ui_mode: 'embedded',
                        line_items: [
                            {
                                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                                price: priceId,
                                quantity: 1,
                            },
                        ],
                        mode: 'payment',
                        return_url,
                        // customer_email: user?.email,
                        automatic_tax: { enabled: true },
                    })

                    const user = await getUserFromRequest(request)
                    if (user) {
                        await redis.save(`payments:${session.id}`, { userId: user.id, priceId }, undefined, 60 * 60 * 24 * 30)
                    }

                    response.status(200).send({ clientSecret: session.client_secret })
                } catch (err) {
                    response.status(500).send({ error: "Internal error" })
                }
            },
            get: async (request, response) => {
                if (!request.query.session_id) return response.status(401).send({ error: "Invalid request" })
                const session = await stripe().checkout.sessions.retrieve(request.query.session_id)

                const user = await redis.get(`payments:${session.id}`)
                if (user && session.status === "complete") {
                    await redis.remove(`payments:${session.id}`)
                    dal.update<Partial<User>>(`/items/users/${user.userId}`, { payment: session.id })
                }
                response.status(200).send({
                    status: session.status,
                    customer_email: session.customer_details?.email
                })
            }
        },
        "google/validation": {
            post: async (request, response) => {
                let sameSite = "Strict"
                const fromSite = request.headers?.origin || (request.headers?.referer || "")

                if (fromSite.startsWith("http://localhost")) sameSite = "None"
                const { body } = request
                const ticket = await client.verifyIdToken({
                    idToken: body.token,
                    audience: GOOGLE_CLIENT_ID,
                })
                const payload = ticket.getPayload()
                if (payload && payload.email_verified) {
                    let user = (await findByEmail(payload.email!))[0]
                    if (!user) {
                        user = await dal.create<User>(`/items/users`, {
                            email: payload.email,
                            firstName: payload.given_name || "",
                            password: '',
                            registrationProvider: 'google',
                            emailVerified: true,
                        })
                    }
                    const jwt = encrypt(user)
                    if (!jwt)
                        return response.status(500).send({ error: "Internal error" })

                    response.headers = { ...response.headers, "Set-Cookie": `${AUTH_COOKIE}=${jwt}; Path=/; ${sameSite === "None" ? "" : "HttpOnly;"} SameSite=${sameSite}; ${sameSite === "None" ? "Secure; " : ""}Max-Age=31536000;` }
                    response.status(200).send({ ...user, password: undefined, token: jwt })

                }
            }
        }
    }
}

export default route
