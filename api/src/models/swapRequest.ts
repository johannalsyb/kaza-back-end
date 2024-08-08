import { randomUUID } from "crypto";
import { Chat, ChatMessage, ChatMessageInput, SwapRequest } from "../../../common/src/types/SwapRequest";
import { NEW_MESSAGE_NOTIFICATION_DELAY_MIN, S3_CHATS_BUCKET, S3_CHATS_PREFIX, S3_IMAGES_BUCKET, S3_IMAGES_PREFIX } from "../config";
import { dal } from "../dal";
import redis from "../services/redis";
import s3 from "../services/s3";
import { resize } from "../services/images";
import mime from "../utils/mime";
import { ScheduledNotification, findScheduledNotification, schedule as scheduleNotification } from "../utils/notifications";

type S3ChatFileFormat = {meta: {code: number, time: number}, data: Chat}

const timestamp = () => new Date().toISOString().replace(/-|T|\:/g, '').substring(0, 14)

export const getChat = async (swapRequestId: string): Promise<S3ChatFileFormat> => {
    const str = await s3.getInstance("chats").get(S3_CHATS_BUCKET, `${S3_CHATS_PREFIX}/swap_requests/${swapRequestId}/chat.json`)
    .catch(err => JSON.stringify({meta: {code: 200, time: 0}, data: []}))
    return JSON.parse(str) as S3ChatFileFormat
}

export const getChatUrl = async (swapRequestId: string): Promise<string | null> => {
    const exists = await s3.getInstance("chats").ls(S3_CHATS_BUCKET, `${S3_CHATS_PREFIX}/swap_requests/${swapRequestId}/chat.json`)
    if(!exists.length) return null
    return s3.getInstance("chats").getUrl(S3_CHATS_BUCKET, `${S3_CHATS_PREFIX}/swap_requests/${swapRequestId}/chat.json`)
}

export const getScheduledNotificationId = (to: string, srId: string) => `swaprequest_message/${srId}/${to}`

export const findNewMessageScheduledNotificationForUser = async (userId:string, scheduleNotificationList?:ScheduledNotification[]) => {
    const sn = scheduleNotificationList || await findScheduledNotification(userId)
    const id = getScheduledNotificationId(userId, ".*")
    const regexp = new RegExp(id)
    const fsn = sn.filter(n => {
        const match = n.id.match(regexp)
        return !!match
    })
    return fsn
}

export const addChatMessage = async ({
    swapRequestId,
    message,
    updateSwapRequest = true,
    sendNotification = false  
}:{
    swapRequestId:string,
    message:ChatMessageInput,
    updateSwapRequest?: boolean,
    sendNotification?:boolean
}): Promise<ChatMessage> => {
    const cm:ChatMessage = {
        at: Date.now(),
        ...message
    }
    if(updateSwapRequest) {
        await dal.update<SwapRequest>(`/items/swap_requests/${swapRequestId}`, {
            lastMessage: JSON.stringify({
                ...cm,
                attachments: undefined,
                message: cm.message.substring(0, 50)
            })
        }).catch(err => null)
    }

    if(message.attachments && message.attachments.length) {
        const promises = message.attachments.map(a => {
            if(a.startsWith("http")) return Promise.resolve(a)
            else if(a.startsWith("data:image/")) {
                /* Convert the image to webp */
                return uploadPicture(swapRequestId, a)
                .catch(err => {})
            }
            else if(a.startsWith("data:video/")) {
                /* Do not convert any video */
                return uploadVideo(swapRequestId, a)
                .catch(err => {})
            }
            else {
                /* Do nothing if the attachment is not an image or a video */
                return Promise.resolve()
            }
        })
        const urls = await Promise.all(promises)
        cm.attachments = urls.filter(u => !!u) as string[]
    }

    const chat = await getChat(swapRequestId)
    chat.data.push(cm)

    await s3.getInstance("chats").put(JSON.stringify(chat), S3_CHATS_BUCKET, `${S3_CHATS_PREFIX}/swap_requests/${swapRequestId}/chat.json`, "application/json")

    redis.pubsub.publish(`chat:${swapRequestId}`, JSON.stringify(cm))
        .then(n => {
            if(n <= 1 && sendNotification) {
                // Add to notification stack if user is not connected
                return scheduleNotification({
                    id: getScheduledNotificationId(message.to, swapRequestId),
                    type: "swaprequest_message",
                    from: message.from,
                    to: message.to,
                    data: {swapRequestId},
                    title: "You received a message",
                    scheduled: Date.now()+(NEW_MESSAGE_NOTIFICATION_DELAY_MIN*60*1000)
                })
            }
        })
        .catch(err => null)

    return cm
}

export const uploadFile = async (srId:string, filename:string, mime:string, buffer:Buffer):Promise<string> => {
    return s3.getInstance("images").put(buffer, S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/swap_requests/${srId}/attachments/${filename}`, mime, true)
}

export const uploadPicture = async (srId:string, b64:string):Promise<string> => {
    const imageId = timestamp()+"-photo"
    const bb = b64.startsWith("data:image/") ? b64.split(",")[1] : b64
    const buffer = Buffer.from(bb, "base64")
    return resize(buffer, 512)
        .then(r => uploadFile(srId, `${imageId}.webp`, "image/webp", r))
}

export const uploadVideo = async (srId:string, b64:string):Promise<string> => {
    const videoId = timestamp()+"-video"
    let extension = "mp4"
    let code = "video/mp4"
    if(b64.startsWith("data:video/")) {
        code = b64.split(";")[0].split(":")[1]
        const vmime = mime[code]
        if(vmime && vmime.extensions) extension = vmime.extensions[0]
    }
    const bb = b64.startsWith("data:video/") ? b64.split(",")[1] : b64
    const buffer = Buffer.from(bb, "base64")
    return uploadFile(srId, `${videoId}.${extension}`, code, buffer)
}