import { url } from "inspector";
import { User } from "../../../common/src";
import Translation from "../../../common/src/types/Translation";
import { dal } from "../dal";
import sendEmail from "../services/email";
import sendSMS from "../services/sms";
import urlShortener from "../services/urlShortener";
import { addNotification } from "../models/user";
import fs from "fs/promises";
import redis from "../services/redis";

type NotificationName = "swaprequest_new" | "swaprequest_accepted" | "swaprequest_declined" | "swaprequest_message"

export type Notification = {
    type: NotificationName,
    to: Partial<User> | string,
    data?: any,
    from?: string,
    title?: string
}

export type ScheduledNotification = Notification & {
    id:string,
    scheduled: number
}

export const schedule = async (notification:ScheduledNotification) => {
    console.log("**************** Scheduling notification", notification)
    return redis.save(`notification:${notification.id}`, notification)
}

export const findScheduledReadyToSend = async () => {
    const sn = await findScheduledNotification()
    return sn.filter(n => n.scheduled <= Date.now())
}

export const findScheduledNotification = async (userId:string = "") => {
    const sn = await redis.find(`notification:*${userId}`) as ScheduledNotification[]
    console.log("*************** Found", sn.length, "notifications")
    return sn
}

export const deleteScheduled = async (id:string) => {
    return redis.remove(`notification:${id}`)
}

export const send = async (notification:Notification, replace:{
    url?:string
    user?:string
    location?:string
} = {}) => {
    const markdown = await dal.get<Translation>(`/items/translations/notification_${notification.type}`).catch(err => null)
    if(!markdown) return null

    let u:User
    if(typeof notification.to === "string" ||
        (!notification.to.commsPref ||
        !notification.to.firstName ||
        !notification.to.languagePref ||
        !notification.to.email || notification.to.emailVerified === undefined ||
        !notification.to.phone || notification.to.phoneVerified === undefined
    )) {
        u = await dal.get<User>(`/items/users/${typeof notification.to === "string" ? notification.to : notification.to.id}`)
        if(!u) return null
    } else u = notification.to as User

    let mdContent:string = (markdown as any)[u.languagePref] || markdown.english
    mdContent = mdContent.replaceAll("%firstName%", u.firstName)
    if(replace.url) mdContent = mdContent.replaceAll("%url%", replace.url)
    const not = addNotification(u.id, mdContent, replace.url || "", notification.from, notification.title)

    const promises:{
        email?:[Promise<Translation | null>, Promise<Translation | null>]
        sms?:Promise<Translation | null>
    } = {}

    if(!u.commsPref || (u.commsPref?.includes("email") && u.email && u.email.length > 0 && u.emailVerified)) {
        const email = dal.get<Translation>(`/items/translations/notification_${notification.type}_email`).catch(err => null)
        const emailTitle = dal.get<Translation>(`/items/translations/notification_${notification.type}_email_title`).catch(err => null)
        promises.email = [email, emailTitle]
    }

    const hasPhone = u.phone && u.phone.length > 0
    const shouldSendSms = (!u.commsPref || u.commsPref?.includes("sms")) && hasPhone
    if(
        (shouldSendSms) 
        // || (u.commsPref?.includes("phone") && hasPhone)
    ) {
        promises.sms = dal.get<Translation>(`/items/translations/notification_${notification.type}_sms`).catch(err => null)
    }

    /* TODO: Implement push notification */
    // if(u.commsPref.includes("push") && u.pushToken && u.pushToken.length > 0) {
    // }

    const [email, emailTitle] = await (promises.email ? Promise.all(promises.email) : Promise.resolve([null, null]))
    const sms = await promises.sms

    let pemail:Promise<any> | undefined = undefined
    let psms:Promise<any> | undefined = undefined

    if(email && email.enabled && emailTitle) {
        let content:string = (email as any)[u.languagePref] || email.english
        content = content.startsWith("file://") ? await fs.readFile(content.replace("file:/", "."), {encoding: "utf8"}) : content
        content = content.replaceAll("%firstName%", u.firstName)
        if(replace.url) content = content.replaceAll("%url%", replace.url)
        if(replace.user) content = content.replaceAll("%user%", replace.user)
        pemail = sendEmail({
            to: [{email: u.email, name: u.firstName}],
            content,
            subject: (emailTitle as any)[u.languagePref] || emailTitle.english,
            contentType: "text/html",
        })
    }

    if(sms && sms.enabled) {
        let message = (sms as any)[u.languagePref] || sms.english
        if(replace.user) message = message.replaceAll("%user%", replace.user)
        if(replace.location) message = message.replaceAll("%location%", replace.location)

        if(message.length > 0) {
            psms = sendSMS({
                to: u.phone,
                message
            })
        }
    }

    return [not, pemail, psms]
}

export default send