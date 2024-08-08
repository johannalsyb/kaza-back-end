import Translation from "../../../common/src/types/Translation"
import { DAEMON_INCOMPLETE_PROFILES_CHECK_HRS, DAEMON_NOTIFICATION_CHECK_MIN } from "../config"
import { dal } from "../dal"
import { getAppUrl } from "../utils"
import send, { deleteScheduled, findScheduledReadyToSend } from "../utils/notifications"
import { findIncompleteProfiles, markIncompleteProfiles, sendIncompleteProfileEmail } from "../models/user"
import { rebuildMatches } from "../models/match"

const checkNotifications = () => {
    console.log("========== Send scheduled notifications")
    return findScheduledReadyToSend()
    .then(async nots => {
        for(var n of nots) {
            let url:string | undefined = undefined
            if(n.type === "swaprequest_message") url = `${getAppUrl()}/chats/${n.data.swapRequestId}`
            await send(n, {url}).then(data => {
                deleteScheduled(n.id)
            })
        }
    })
    .catch(console.error)
}

export const checkIncompleteProfiles = async () => {
    console.log("========== Checking incomplete profiles")
    const pp = await markIncompleteProfiles()
    const profiles = await findIncompleteProfiles()
    const email = await dal.get<Translation>(`/items/translations/complete_profile_email`).catch(err => null)
    const emailTitle = await dal.get<Translation>(`/items/translations/complete_profile_email_title`).catch(err => null)
    if(!email || !emailTitle || (email && !email.enabled)) return
    return profiles.map(async p => p.user.id && sendIncompleteProfileEmail(p.user.id, {content: email, title: emailTitle}))
}

export const checkMatches = async () => {
    console.log("========== Checking matches")
    await rebuildMatches({})
}

const start = async () => {
    console.log("========== STARTING DAEMON ==========")
    setInterval(checkNotifications, 1000 * 60 * DAEMON_NOTIFICATION_CHECK_MIN)
    setInterval(checkIncompleteProfiles, 1000 * 60 * 60 * DAEMON_INCOMPLETE_PROFILES_CHECK_HRS)
    setInterval(checkMatches, 1000 * 60 * 60 * DAEMON_INCOMPLETE_PROFILES_CHECK_HRS)
}

export default start