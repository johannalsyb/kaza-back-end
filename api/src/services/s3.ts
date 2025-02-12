import { 
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    ListObjectsCommand,
    DeleteObjectCommand,
    DeleteObjectCommandInput,
    ListObjectsV2Command,
    CopyObjectCommand,
    CopyObjectCommandInput
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Readable } from "stream";
import {
    S3_CHATS_ACCESS_KEY,
    S3_CHATS_BUCKET,
    S3_CHATS_ENDPOINT,
    S3_CHATS_PREFIX,
    S3_CHATS_REGION,
    S3_CHATS_SECRET_KEY,
    S3_CHATS_SERVER_URL,
    S3_IMAGES_ACCESS_KEY,
    S3_IMAGES_BUCKET,
    S3_IMAGES_ENDPOINT,
    S3_IMAGES_PREFIX,
    S3_IMAGES_REGION,
    S3_IMAGES_SECRET_KEY,
    S3_IMAGES_SERVER_URL,
    S3_NOTIFICATIONS_ACCESS_KEY,
    S3_NOTIFICATIONS_BUCKET,
    S3_NOTIFICATIONS_ENDPOINT,
    S3_NOTIFICATIONS_PREFIX,
    S3_NOTIFICATIONS_REGION,
    S3_NOTIFICATIONS_SECRET_KEY,
    S3_NOTIFICATIONS_SERVER_URL
} from "../config";

export type S3Configuration = {
    region: string,
    endpoint?: string,
    accessKeyId?: string,
    secretAccessKey?: string,
    bucket: string,
    prefix: string,
    serverUrl?: string
}
type S3ClientTypes = "images" | "chats" | "notifications"
type FileInputType = string | Buffer | Uint8Array | Readable | ReadableStream<any> | Blob


const S3Configurations:{[key:string]: S3Configuration} = {
    images: {
        region: S3_IMAGES_REGION,
        endpoint: S3_IMAGES_ENDPOINT,
        accessKeyId: S3_IMAGES_ACCESS_KEY,
        secretAccessKey: S3_IMAGES_SECRET_KEY,
        bucket: S3_IMAGES_BUCKET,
        prefix: S3_IMAGES_PREFIX,
        serverUrl: S3_IMAGES_SERVER_URL
    },
    notifications: {
        region: S3_NOTIFICATIONS_REGION,
        endpoint: S3_NOTIFICATIONS_ENDPOINT,
        accessKeyId: S3_NOTIFICATIONS_ACCESS_KEY,
        secretAccessKey: S3_NOTIFICATIONS_SECRET_KEY,
        bucket: S3_NOTIFICATIONS_BUCKET,
        prefix: S3_NOTIFICATIONS_PREFIX,
        serverUrl: S3_NOTIFICATIONS_SERVER_URL
    },
    chats: {
        region: S3_CHATS_REGION,
        endpoint: S3_CHATS_ENDPOINT,
        accessKeyId: S3_CHATS_ACCESS_KEY,
        secretAccessKey: S3_CHATS_SECRET_KEY,
        bucket: S3_CHATS_BUCKET,
        prefix: S3_CHATS_PREFIX,
        serverUrl: S3_CHATS_SERVER_URL
    }
}

const instances = new Map<S3ClientTypes, S3>()
const clients = new Map<S3ClientTypes, S3Client>()

export default class S3 {

    private client:S3Client
    private serverUrl:string
    private prefix:string

    public static getInstance = (type:S3ClientTypes): S3 => {
        if(!instances.has(type)) {
            instances.set(type, new S3(type))
        }
        return instances.get(type)!
    }

    private constructor(type:S3ClientTypes) {
        const conf = S3Configurations[type]
        if(!conf) throw new Error("No configuration for S3 type "+type)
        if(!clients.has(type)) {
            let credentials = undefined
            if(conf.accessKeyId && conf.secretAccessKey) {
                credentials = {
                    accessKeyId: conf.accessKeyId,
                    secretAccessKey: conf.secretAccessKey,
                }
            }
            this.client = new S3Client({
                region: conf.region,
                endpoint: conf.endpoint,
                credentials
            })
            clients.set(type, this.client)
        }
        this.client = clients.get(type)!
        this.serverUrl = conf.serverUrl || `https://${conf.bucket}.s3.${conf.region}.amazonaws.com`
        this.prefix = conf.prefix || ""
    }

    private fileUrl = (bucket: string, key:string): string => {   
        let url = `https://${bucket}.s3.amazonaws.com/${key}`
        if(this.serverUrl) url = `${this.serverUrl}/${key}`
        return url.replace("://", "##").replaceAll("//", "/").replace("##", "://") 
    }


    public put = async (file: FileInputType, bucket: string, key: string, mime?: string, publicRead?: boolean): Promise<string> => {
        const options:any = {Bucket: bucket, Key: key, Body: file, ACL: publicRead ? "public-read" : "private"}
        if(mime) options.ContentType = mime
        const command = new PutObjectCommand(options)
        const result = await this.client.send(command)
        if(result.$metadata?.httpStatusCode && result.$metadata?.httpStatusCode >= 400)
            throw new Error("Failed to sync file")
        return this.fileUrl(bucket, key)
    }

    public ls = async (bucket: string, prefix: string, options:{
        filter?:string,
        MaxKeys?:number,
        ContinuationToken?:string,
        url?:boolean
    } = {}): Promise<string[]> => {
        const {MaxKeys, ContinuationToken, filter, url} = options
        const opts:any = {Bucket: bucket, Prefix: prefix, MaxKeys: MaxKeys || 100, ContinuationToken}
        const command = new ListObjectsV2Command(opts)
        const result = await this.client.send(command)
        let res = result.Contents?.map(c => c.Key) as string[] || []
        if(filter) {
            const regexp = new RegExp(filter)
            res = res.filter(r => {
                const match = r.match(regexp)
                return !!match
            })
        }
        if(url) {
            res = res.map(r => this.fileUrl(bucket, r))
        }
        if(result.NextContinuationToken) {
            const res2 = await this.ls(bucket, prefix, {
                filter,
                MaxKeys,
                ContinuationToken: result.NextContinuationToken,
                url
            })
            return [...res, ...res2]
        }

        return res
    }

    public get = async (bucket: string, key:string) => {
        const options:any = {Bucket: bucket, Key: key}
        const command = new GetObjectCommand(options)
        const result = await this.client.send(command)
        if(!result.Body) throw new Error("Failed to get file")
        return result.Body.transformToString()
    }

    public getUrl = async (bucket: string, key:string): Promise<string> => {
        const options:any = {Bucket: bucket, Key: key}
        const command = new GetObjectCommand(options)
        const client = await this.client
        const url = await getSignedUrl(client as any, command as any, { expiresIn: 30 });
        if(!url || !url.length)    throw new Error("Failed to get signed url")
        return url
    }

    public del = async (bucket: string, key:string): Promise<void> => {
        const options:DeleteObjectCommandInput = {Bucket: bucket, Key: key}
        const command = new DeleteObjectCommand(options)
        await this.client.send(command)
    }

    public copy = async (bucket: string, key:string, newKey:string): Promise<void> => {
        const options:CopyObjectCommandInput = {Bucket: bucket, Key: newKey, CopySource: `/${bucket}/${key}`}
        const command = new CopyObjectCommand(options)
        await this.client.send(command)
    }


    public move = async (bucket: string, key:string, newKey:string): Promise<void> => {
        await this.copy(bucket, key, newKey)
        await this.del(bucket, key)
    }

    public getServerUrl = () => `${this.serverUrl}${this.serverUrl.endsWith("/") ? "" : "/"}${this.prefix.startsWith("/") ? this.prefix.substring(1) : this.prefix}`
}
