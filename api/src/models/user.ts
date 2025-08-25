import type User from "../../../common/src/types/User"
import type Translation from "../../../common/src/types/Translation"
import type Notification from "../../../common/src/types/Notification"
import { dal } from "../dal"
import sendEmail from "../services/email"
import sendSMS from "../services/sms"
import Temp from "../../../common/src/types/Temp"
import urlShortener from "../services/urlShortener"
import { randomUUID, verify } from "crypto"
import { resize, rotate } from "../services/images"
import { DAEMON_INCOMPLETE_PROFILES_CHECK_HRS, DAEMON_INCOMPLETE_PROFILES_NOTIFICATION_HRS, IMAGE_SERVER, IMAGE_USER_THUMBNAIL_WIDTH, IMAGE_USER_WIDTH, S3_IMAGES_BUCKET, S3_IMAGES_PREFIX, S3_NOTIFICATIONS_BUCKET, S3_NOTIFICATIONS_PREFIX } from "../config"
import s3 from "../services/s3"
import fs from "fs/promises"
import redis from "../services/redis"
import { countNewMatchesForUser } from "./match"

export const findById = async (id: string) => {
    return dal.get<User>(`/items/users/${id}`).catch(err => null)
}

export const findByEmail = async (email: string) => {
    const qso: any = {
        "filter": JSON.stringify({ email }),
    }
    const url = `/items/users?${new URLSearchParams(qso).toString()}`
    return dal.find<User>(url)
}

export const email = {
    verifyEmail: async (token: string): Promise<[number, string]> => {
        if (!token.length) return [400, "Invalid token"]
        const temp = await dal.get<Temp>(`/items/temp/${token}`).catch(err => null)
        if (!temp) return [404, "Invalid token"]
        if (temp.type !== "verifyemail") return [404, "Invalid token"]
        if (temp.expiry < Date.now()) {
            await dal.delete(`/items/temp/${token}`)
            return [404, "Invalid token"]
        }
        const user = await dal.get<User>(`/items/users/${temp.data}`)
        if (!user) return [404, "Invalid token"]
        await dal.delete(`/items/temp/${token}`)
        await dal.update<User>(`/items/users/${user.id}`, { emailVerified: true, updatedAt: new Date().toISOString() })
        return [200, "Success"]

    },
    sendVerifyEmail: async (user: User, host: string) => {
        const temp = await dal.create<Temp>(`/items/temp`, {
            type: "verifyemail",
            expiry: Date.now() + 1000 * 3600 * 24 * 31, // 31 days
            data: user.id
        })
        const url = `${host}/verify?type=email&token=${temp.id}`

        // Use SendGrid dynamic template instead of manual template replacement
        await sendEmail({
            to: [{ email: user.email, name: user.firstName }],
            template_id: "d-b1a5ed5e048c4b2baf6520ff16d8f73c", // Your SendGrid dynamic template ID
            dynamic_template_data: {
                "first_name": user.firstName,
                "confirm_url": url
            }
        })

        return url
    }
}

export const phone = {
    sendVerifySms: async (user: User): Promise<[string, any]> => {
        const code = Math.random().toFixed(6).slice(2)
        let text = await dal.get<Translation>(`/items/translations/sms_verify`)
        text.english = text.english!.replaceAll("%code%", code)
        await redis.save(`phone:${code}`, { id: user.id }, undefined, 30 * 60) // 30 mins
        const resp = await sendSMS({
            to: user.phone,
            message: text.english
        })
        return [code, resp]
    },
    verify: async (code: string) => {
        const user = await redis.get(`phone:${code}`)
        if (!user || !user.id) return false
        await redis.remove(`phone:${code}`)
        const updatedUser = await dal.update<User>(`/items/users/${user.id}`, { phoneVerified: true, updatedAt: new Date().toISOString() })
        return updatedUser
    }
}

export const resetPasswordRequest = async (user: User) => {
    const temp = await dal.create<Temp>(`/items/temp`, {
        type: "resetpassword",
        expiry: Date.now() + 1000 * 3600 * 48, // 48 hours
        data: user.id
    })
    return temp.id
}

export const sendPasswordResetEmail = async (user: User, host: string, id?: string) => {
    if (!id) id = await resetPasswordRequest(user)
    // const host = request.headers?.origin || (request.headers?.referer ? request.headers?.referer.substring(0, request.headers?.referer.indexOf("/", 9)) : "http://localhost:4444")
    const url = `${host}/resetpassword?token=${id}`
    const translations = await dal.find<Translation>(`/items/translations?filter=${JSON.stringify({ "_or": [{ id: "email_resetpassword" }, { id: "email_resetpassword_title" }] })}`)
    const emailTemplate = translations.find(t => t.id === "email_resetpassword")!
    emailTemplate.english = emailTemplate.english.startsWith("file://") ? await fs.readFile(emailTemplate.english.replace("file:/", "."), { encoding: "utf8" }) : emailTemplate.english
    emailTemplate.english = emailTemplate.english.replaceAll("%url%", url)
    const emailTitle = translations.find(t => t.id === "email_resetpassword_title")!
    const email = {
        to: [{ email: user.email, name: user.firstName }],
        content: emailTemplate.english,
        subject: emailTitle.english,
    }
    await sendEmail({ ...email, contentType: "text/html" })

    return url
}

export const sendAccountVerifiedEmail = async (user: User) => {
    const translations = await dal.find<Translation>(`/items/translations?filter=${JSON.stringify({ "_or": [{ id: "account_approved_email" }, { id: "account_approved_email_title" }] })}`)
    const emailTemplate = translations.find(t => t.id === "account_approved_email")!
    emailTemplate.english = emailTemplate.english.startsWith("file://") ? await fs.readFile(emailTemplate.english.replace("file:/", "."), { encoding: "utf8" }) : emailTemplate.english
    emailTemplate.english = emailTemplate.english.replaceAll("%firstName%", user.firstName)
    const emailTitle = translations.find(t => t.id === "account_approved_email_title")!
    const email = {
        to: [{ email: user.email, name: user.firstName }],
        content: emailTemplate.english,
        subject: emailTitle.english,
    }
    await sendEmail({ ...email, contentType: "text/html" })
}


export const uploadPicture = async (userId: string, b64: string): Promise<string> => {
    const imageId = randomUUID() //"profile"
    const bb = b64.startsWith("data:image/") ? b64.split(",")[1] : b64
    const buffer = bb.startsWith("http") ? await fetch(bb)
        .then(res => res.arrayBuffer()) : Buffer.from(bb, "base64")
    await Promise.all([
        resize(buffer, IMAGE_USER_WIDTH)
            .then(r => s3.getInstance("images").put(r, S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/users/${userId}/${imageId}.webp`, "image/webp", true)),
        resize(buffer, IMAGE_USER_THUMBNAIL_WIDTH)
            .then(r => s3.getInstance("images").put(r, S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/users/${userId}/${imageId}_thumbnail.webp`, "image/webp", true))
    ])
    await dal.update<User>(`/items/users/${userId}`, {
        primaryImage: imageId,
        updatedAt: new Date().toISOString()
    })
    return imageId
}

export const rotatePicture = async (userId: string, currentPictureId: string, degrees: number): Promise<string> => {
    const imageId = randomUUID() //"profile"

    const s3Img = s3.getInstance("images")

    const url = `${s3Img.getServerUrl()}/users/${userId}/${currentPictureId}.webp`
    const url_thumbnail = `${s3Img.getServerUrl()}/users/${userId}/${currentPictureId}_thumbnail.webp`

    await Promise.all([
        rotate(url, degrees)
            .then(r => s3Img.put(r, S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/users/${userId}/${imageId}.webp`, "image/webp", true)),
        rotate(url_thumbnail, degrees)
            .then(r => s3Img.put(r, S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/users/${userId}/${imageId}_thumbnail.webp`, "image/webp", true))
    ])
    await dal.update<User>(`/items/users/${userId}`, {
        primaryImage: imageId,
        updatedAt: new Date().toISOString()
    })

    await Promise.all([
        s3Img.del(S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/users/${userId}/${currentPictureId}.webp`),
        s3Img.del(S3_IMAGES_BUCKET, `${S3_IMAGES_PREFIX}/users/${userId}/${currentPictureId}_thumbnail.webp`)
    ]).catch((err) => {
        console.log("Error deleting old image", err)
    })

    return imageId
}


export const addNotification = async (userId: string, text: string, url: string, from?: string, title?: string) => {
    const now = Date.now()
    const id = `${now}-${randomUUID()}`
    const not: Notification = {
        id,
        time: now,
        text,
        url,
        from,
        title
    }
    return s3.getInstance("notifications").put(JSON.stringify(not), S3_NOTIFICATIONS_BUCKET, `${S3_NOTIFICATIONS_PREFIX}/users/${userId}/unread/${id}`, "application/json")
}

export const readNotifications = async (userId: string, ...notsIds: string[]) => {
    const now = Date.now()
    return Promise.all(
        notsIds.map(notId => s3.getInstance("notifications").move(S3_NOTIFICATIONS_BUCKET, `${S3_NOTIFICATIONS_PREFIX}/users/${userId}/unread/${notId}`, `${S3_NOTIFICATIONS_PREFIX}/users/${userId}/read/${notId}_${now}`).catch(err => null))
    )
}

export const deleteNotifications = async (userId: string, ...notsIds: string[]) => {
    return Promise.all(
        notsIds.map(notId =>
            s3.getInstance("notifications").ls(S3_NOTIFICATIONS_BUCKET, `${S3_NOTIFICATIONS_PREFIX}/users/${userId}/read/${notId}`)
                .then(keys => keys.forEach(key => s3.getInstance("notifications").del(S3_NOTIFICATIONS_BUCKET, key))).catch(err => null)
        ))
}

export const getNotificationsIds = async (userId: string, read: boolean): Promise<string[]> => {
    const prefix = `${S3_NOTIFICATIONS_PREFIX}/users/${userId}/${read ? "read" : "unread"}/`
    const keys = await s3.getInstance("notifications").ls(S3_NOTIFICATIONS_BUCKET, prefix)
    return keys.map(key => key.split("/").slice(-1)[0])
}

export const getNotifications = async (userId: string, read: boolean): Promise<Notification[]> => {
    const prefix = `${S3_NOTIFICATIONS_PREFIX}/users/${userId}/${read ? "read" : "unread"}/`
    const keys = await s3.getInstance("notifications")?.ls(S3_NOTIFICATIONS_BUCKET, prefix) ?? []

    const nots = await Promise.all(keys.map(async key => {
        try {
            const not = JSON.parse(await s3.getInstance("notifications").get(S3_NOTIFICATIONS_BUCKET, key)) as Notification

            if (!not) return null
            if (!not.id) not.id = key.split("/").slice(-1)[0]
            if (read) {
                const readAt = key.split("/").slice(-1)[0].split("_").slice(-1)[0]
                not.readAt = new Date(parseInt(readAt)).getTime()
            }
            return not
        } catch (err) {
            console.log('error', err)
            return {}
        }
    }))

    return (nots?.filter(n => !!n) as Notification[])?.sort((a, b) => b!.time - a!.time) ?? []
}

export const countNotifications = async (userId: string, read: boolean): Promise<number> => {
    const prefix = `${S3_NOTIFICATIONS_PREFIX}/users/${userId}/${read ? "read" : "unread"}/`
    const keys = await s3.getInstance("notifications").ls(S3_NOTIFICATIONS_BUCKET, prefix)
    return keys.length
}

export const countNewMatches = async (userId: string): Promise<number> => {
    return countNewMatchesForUser(userId)
}

type IncompleteProfile = {
    user: Partial<User>,
    scheduled: string
}

export const markIncompleteProfiles = async () => {
    const incompleteUserDetail: any = {
        "_and": [
            { "verified": false },
            {
                "_or": [
                    {
                        "_and": [
                            { "onboarding": { "_ncontains": `"completed":true` } },
                            { "onboarding": { "_ncontains": `"completeProfileEmailSent":true` } },
                        ]
                    },
                    { "onboarding": { "_null": true } },
                ]
            },
        ]
    }
    const users = await dal.find<User>(`/items/users?filter=${JSON.stringify(incompleteUserDetail)}&limit=-1&fields=id,onboarding,createdAt,email,firstName`)
    await Promise.all(users.map(u => redis.save(`incompleteprofile:${u.id}`, {
        user: u,
        scheduled: new Date(new Date(u.createdAt).getTime() + DAEMON_INCOMPLETE_PROFILES_NOTIFICATION_HRS * 3600 * 1000).toISOString()
    })))
    return users
}

export const sendIncompleteProfileEmail = async (id: string, email?: {
    content: Translation,
    title: Translation
}) => {
    const uu = await dal.get<User>(`/items/users/${id}?fields=email,firstName,onboarding`).catch(err => null)
    if (!uu) return null
    let eemail = email
    if (!eemail) {
        const cpemail = await dal.get<Translation>(`/items/translations/complete_profile_email`).catch(err => null)
        const cpemailTitle = await dal.get<Translation>(`/items/translations/complete_profile_email_title`).catch(err => null)
        if (!cpemail || !cpemailTitle || (cpemail && !cpemail.enabled)) return
        eemail = {
            content: cpemail,
            title: cpemailTitle
        }
    }
    let content = eemail.content.english.startsWith("file://") ? await fs.readFile(eemail.content.english.replace("file:/", "."), { encoding: "utf8" }) : eemail.content.english
    content = content.replaceAll("%firstName%", uu.firstName || "there")
    const se = await sendEmail({
        to: [{ email: uu.email, name: uu.firstName || "Kazaswap User" }],
        content,
        subject: eemail.title.english,
        contentType: "text/html",
    }).catch(err => null)

    const ob = uu.onboarding ? JSON.parse(uu.onboarding) : {}
    ob.completeProfileEmailSent = true
    await dal.update(`/items/users/${id}`, { onboarding: ob })
    return redis.remove(`incompleteprofile:${id}`)
}

export const findIncompleteProfiles = async () => {
    const profiles = await redis.find("incompleteprofile:*") as IncompleteProfile[]
    const fprofiles = profiles.filter(p => new Date(p.scheduled).getTime() <= Date.now())
    if (!fprofiles.length) return []
    const url = `/items/users?filter=${JSON.stringify({ id: { "_in": fprofiles.map(p => p.user.id) } })}&fields=id,onboarding`
    const users = await dal.find<User>(url)
    const uncompletedProfiles = fprofiles.filter(f => {
        const u = users.find(u => u.id === f.user.id)
        if (!u) {
            redis.remove(`incompleteprofile:${f.user.id}`)
            return false
        }
        if (u.onboarding) {
            if (!u.onboarding) return true
            try {
                const ob = JSON.parse(u.onboarding)
                if (ob.completeProfileEmailSent) {
                    redis.remove(`incompleteprofile:${f.user.id}`)
                    return false
                }
                if (ob.completed) {
                    redis.remove(`incompleteprofile:${f.user.id}`)
                    return false
                }
            } catch (err) {
                return true
            }
            return true
        }
        return true
    })
    return uncompletedProfiles
}

export default {
    email,
    phone
}