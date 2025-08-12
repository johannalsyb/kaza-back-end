import { RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts, createClient } from 'redis';
import {
    REDIS_URL,
    // REDIS_PUBSUB_GZIP,
    DEBUG
} from '../config';

type RedisClient = RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>

const clients: Map<string, RedisClient> = new Map();
const subscribers: Map<string, {client: RedisClient, channel: string}> = new Map();
const newClient = (url:string = REDIS_URL) => createClient({url});

/**
 * Get a redis client
 * @param name The name of the client
 * @returns A redis client
*/
export const getClient = async (name:string = "default", url:string = REDIS_URL) => {
    let client:RedisClient
    if (!clients.has(name)) {
        client = newClient(url)
        await new Promise<void>((res, rej) => {
            client.on('error', err => {
                console.debug('Redis Client Error', name, err.message)
                // clients.delete(name)
                rej(err)
            })
            client.on('connect', () => {
                console.debug(`Redis Client Connected to ${url}`, name)
                clients.set(name, client)
                res()
            })
            client.on('end', () => {
                console.debug('Redis Client End', name)
                clients.delete(name)
            })
            client.connect()
        })
    } else {
        client = clients.get(name) as RedisClientType;
    }
    return client
}

/** 
 * Publish a message to a channel
 * @param channel The channel to publish to
 * @param message The message to publish
 * @returns The number of clients that received the message
 */
export const publish = async (channel: string, message: string) => {
    const client = await getClient()
    let msg:string
    // if(REDIS_PUBSUB_GZIP) {
    //     msg = await new Promise((res, rej) => {
    //         zlib.deflate(message, (err, buffer) => {
    //             if(err) return rej(err)
    //             res(buffer.toString("base64"))
    //         })
    //     })
    //     console.debug(`PUBLISHING ${msg.length} bytes from ${message.length} bytes (ratio: ${message.length / msg.length})`)
    // } else {
        msg = message
    // }
    return await client.publish(channel, msg)
}

/**
 * Subscribe to a channel and call a callback when a message is received
 * Note: If a subscriber already exists for the selected channel, we don't recreate a subscriber
 * @param channel The channel to subscribe to
 * @param callback The callback to call when a message is received
 * @returns A unique id for the subscriber
*/
export const subscribe = async (channel: string, callback: (message: string, channel?: string) => void) => {
    const id = `pubsub:${channel}`
    const uuid = `${id}:${Date.now()}`
    const client = await getClient()
    const subscriber = client.duplicate()
    await subscriber.connect()
    // clients.set(id, subscriber)
    subscribers.set(uuid, {client: subscriber, channel})
    await subscriber.pSubscribe(channel, async (msg, _channel) => {
        let message:string = msg
        // if(REDIS_PUBSUB_GZIP) {
        //     message = await new Promise<string>((res, rej) => {
        //         const bb = Buffer.from(message, "base64")
        //         console.debug(`MESSAGE RECEIVED ${bb.length} bytes`)
        //         zlib.inflate(bb, (err, buffer) => {
        //             if(err) return rej(err)
        //             res(buffer.toString("utf8"))
        //         })
        //     })
        // }

        callback(message, _channel)
    })
    console.log(`DEBUG | PUBSUB - Subscribed to ${channel} (${uuid})`)
    return uuid
}

/**
 * Unsubscribe from a channel
 * @param uuid The unique id of the subscriber
 * @returns True if the unsubscribe was successful
 * Note: If no uuid is provided, we unsubscribe all subscribers from the channel
*/
export const unsubscribe = async (uuid: string):Promise<boolean> => {
    const subscriber = subscribers.get(uuid)
    if(!subscriber) return false
    await subscriber.client.pUnsubscribe(subscriber.channel)
    await subscriber.client.disconnect()
    console.log(`DEBUG | PUBSUB - Unsubscribed to ${subscriber.channel} (${uuid})`)
    subscribers.delete(uuid)
    return true
}

/**
 * Disconnect from redis
 * @param name The name of the client to disconnect from
 * @returns True if the disconnect was successful
*/
export const disconnect = async (name:string = "default") => {
    const client = clients.get(name)
    if(!client) return true
    await client.disconnect()
    return true
}

/**
 * Disconnect all redis clients
*/
export const quit = async () => {
    for (const client of clients.values()) {
        await client.quit()
    }
}

/**
 * Get single entry in redis
 * @param key The key to find
 * @param select The fields to select as an array of strings.
 * If not provided, we return the entire object.
 * If provided, we return an object with only the selected fields,
 * or the value of the field if only one field is selected.
 * Note: If the field is not found, we return null
 * @returns The data if found
 * Note: If the data is not found, we return null
*/
export const get = async (key:string, select?: string[]) => {
    const client = await getClient()
    try {
        const options = select ? {path: select.map(s => {
            if(s.startsWith("$.")) return s
            else return `$.${s}`
        })} : undefined
        const data = await client.json.get(key, options)
        if(select?.length) {
            if(select?.length === 1) {
                const value = (data as any)[0]
                return value ? {[select[0]]: value} : null
            } else {
                const obj = {} as {[key:string]: any}
                Object.keys(data as any).forEach(k => {
                    try {
                        const key = k.replace(/^\$\./, "")
                        obj[key] = (data as any)[k][0]
                    } catch (err) {
                        // console.error(err)
                    }
                })
                return obj
            }
        } else return data as {[key:string]: any}
    } catch (err) {
        // console.error(err)
        return null
    }
}

/**
 * Find one or more entries in redis
 * @param key The key/pattern to find
 * @returns An array of data if found
 * Note: If the data is not found, we return null
*/
export const find = async (pattern:string) => {
    const client = await getClient()
    const keys = await client.keys(pattern)
    if(!keys.length) return []
    const data = await client.json.mGet(keys, '$')
    return data.flat() as {[key:string]: any}[]
}

/**
 * List keys that match a pattern
 * @param pattern The glob-style pattern, e.g. 'phone:*'
 */
export const keys = async (pattern: string) => {
    const client = await getClient()
    return client.keys(pattern)
}

/**
 * Save data to redis
 * @param key The key to save the data under
 * @param data The data to save
 * @param field The field to save the data under (default to $ for root)
 * @returns True if the save was successful
*/
export const save = async (key:string, data:any, field:string = "$", expirySec:number | null = null) => {
    try {
        const client = await getClient()
        const ff = field.startsWith("$.") || field === "$" ? field : `$.${field}`
        const r = await client.json.set(key, ff, data)

        let exp:boolean = true
        if(expirySec) {
            exp = await client.expire(key, expirySec)
        }

        return r === 'OK' && exp
    } catch(err) {
        DEBUG && console.error(err)
        return false
    }
}

/**
 * Delete data from redis
 * @param key The key to delete
 * @returns True if the delete was successful
 * Note: If the data is not found, we return false
*/
export const remove = async (key:string) => {
    const client = await getClient()
    const r = await client.del(key)
    return r === 1
}

/**
 * Check if data exists in redis
 * @param key The key to check
 * @returns True if the data exists
*/
export const exists = async (key:string) => {
    const client = await getClient()
    const r = await client.exists(key)
    return r === 1
}

export const ping = async () => {
    const client = await getClient()
    return client.ping()
}

export default {
    connect: getClient,
    ping,
    get,
    find,
    keys,
    save,
    remove,
    exists,
    pubsub: {
        publish,
        subscribe,
        unsubscribe
    },
}