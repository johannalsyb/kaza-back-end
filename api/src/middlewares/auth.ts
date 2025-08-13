import {
    AUTH_COOKIE,
    AUTH_HEADER,
    AUTH_HEADER_REFRESH,
    AUTH_SKIP,
    REDIS_URL
} from "../config";
import { BMiddleware, BRequest } from "../types";
import crypto from 'crypto'
import { RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts, createClient } from 'redis';
import User from "../../../common/src/types/User";

let skip:boolean = AUTH_SKIP

export const setSkipAuth = (skipAuth:boolean) => {
    skip = skipAuth
}

export const getSkipAuth = () => skip

//Checking the crypto module
const algorithm = process.env.JWT_ALGO || 'aes-256-cbc'
const key = Buffer.from(process.env.JWT_KEY || "0123456789abcdef0123456789abcdef");

type JWTPayload = {
    user: User,
    iat: number,
    exp: number
}

// Encrypting JWT
export const encrypt = (user:User) => {
    try {
        user.password = ""
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
        const jwt:JWTPayload = {user, iat: Date.now(), exp: Date.now() + 1000 * 3600 * 24 * 7}
        let encrypted = cipher.update(JSON.stringify(jwt));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const hiv = iv.toString('hex')
        const enc = encrypted.toString('hex')
        return Buffer.from(hiv+enc, "hex").toString('base64');
    } catch(err) {
        return null
    }
}

// Decrypting JWT
export const decrypt = (text:string):JWTPayload | null => {
    try {
        const hex = Buffer.from(text, 'base64').toString('hex')
        const hiv = hex.substring(0, 32)
        const enc = hex.substring(32)
        const iv = Buffer.from(hiv, 'hex');
        const encryptedText = Buffer.from(enc, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return JSON.parse(decrypted.toString()) as JWTPayload;
    } catch(err) {
        return null
    }
}

let connected = false
// let redis = createClient({url: REDIS_URL})
// .on('error', err => {
//     console.log('Redis Client Error', err)
//     connected = false
// })
// .on('ready', () => {
//     console.log('Redis Client Ready')
//     connected = true
// })
// .on('connect', () => {
//     console.log('Redis Client Connected')
// })
// .on('reconnecting', () => console.log('Redis Client Reconnecting'))
// .on('end', () => console.log('Redis Client End'))
// .on('warning', () => console.log('Redis Client Warning'))
// .on('close', () => {
//     console.log('Redis Client Close')
//     connected = false
// })

export const getUserFromRequest = async (req: BRequest): Promise<User | null> => {
    const apikey = req.headers[AUTH_HEADER.toLowerCase()]
    const bearer = req.headers["authorization"] && req.headers["authorization"].startsWith("Bearer ") ? req.headers["authorization"].substring(7) : null
    const cookie = req.cookies[AUTH_COOKIE.toLowerCase()] || req.headers[AUTH_COOKIE.toLowerCase()]

    if(!(apikey || bearer || cookie))
        return null

    let user:User | null = null
    if(bearer) {
        const jwt = decrypt(bearer)
        user = jwt?.user || null
    } else if(cookie) {
        const jwt = decrypt(cookie)
        user = jwt?.user || null
    } else if(apikey) {
        // if(!connected) await redis.connect()
        // redis.. .(`users:token:${token}`)
    }

    if(!user)
        return null

    return user
}

const auth:BMiddleware = async (req, res) => {
    if(skip) return
    try {
        const user = await getUserFromRequest(req)
        if(!user) {
            console.log("Auth middleware: No user found in request")
            return {code: 401, message: "Unauthorized"}
        }
        console.log(`Auth middleware: User ${user.id} authenticated with role "${user.role}"`)
        req.user = user
    } catch(err:any) {
        console.error("Auth middleware error:", err)
        return {code: 500, message: err.message}
    }
}

export default auth