import Translation from "../../../common/src/types/Translation"
import { DAEMON_INCOMPLETE_PROFILES_CHECK_HRS, DAEMON_NOTIFICATION_CHECK_MIN } from "../config"
import { dal } from "../dal"
import { getAppUrl } from "../utils"
import send, { deleteScheduled, findScheduledReadyToSend } from "../utils/notifications"
import { findIncompleteProfiles, markIncompleteProfiles, sendIncompleteProfileEmail } from "../models/user"
import { rebuildMatches } from "../models/match"
import { CreditManager } from "../services/creditManager"
import cron from 'node-cron'

const checkNotifications = () => {
    console.log("========== Send scheduled notifications")
    return findScheduledReadyToSend()
        .then(async nots => {
            for (var n of nots) {
                let url: string | undefined = undefined
                if (n.type === "swaprequest_message") url = `${getAppUrl()}/chats/${n.data.swapRequestId}`
                await send(n, { url }).then(data => {
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
    if (!email || !emailTitle || (email && !email.enabled)) return
    return profiles.map(async p => p.user.id && sendIncompleteProfileEmail(p.user.id, { content: email, title: emailTitle }))
}

export const checkMatches = async () => {
    console.log("========== Checking matches")
    await rebuildMatches({})
}

// this is the cron job of simple set timeout

// export const checkDailyCreditCron = async () => {
//     console.log("========== Checking daily credit cron")
//     await CreditManager.processDailyCreditCron()
// }

// const start = async () => {
//     console.log("========== STARTING DAEMON ==========")
//     setInterval(checkNotifications, 1000 * 60 * DAEMON_NOTIFICATION_CHECK_MIN)
//     setInterval(checkIncompleteProfiles, 1000 * 60 * 60 * DAEMON_INCOMPLETE_PROFILES_CHECK_HRS)
//     setInterval(checkMatches, 1000 * 60 * 60 * DAEMON_INCOMPLETE_PROFILES_CHECK_HRS)

//     // Schedule daily credit cron job to run at 12 AM (midnight)
//     const scheduleDailyCreditCron = () => {
//         const now = new Date()
//         const tomorrow = new Date(now)
//         tomorrow.setDate(tomorrow.getDate() + 1)
//         tomorrow.setHours(0, 0, 0, 0) // 12 AM midnight

//         const timeUntilMidnight = tomorrow.getTime() - now.getTime()

//         // Schedule the first run
//         setTimeout(() => {
//             checkDailyCreditCron()
//             // Then schedule it to run every 24 hours
//             setInterval(checkDailyCreditCron, 1000 * 60 * 60 * 24)
//         }, timeUntilMidnight)
//     }

//     scheduleDailyCreditCron()
// }


//  this is the cron job of package node/cron
export const checkDailyCreditCron = async () => {
    console.log("========== Checking daily credit cron")
    // await CreditManager.processDailyCreditCron()
    // ✅ Log cron start in credits_logs
    await dal.create('/items/credits_logs', {
        reason: "cron job started successfully",
        details: JSON.stringify({
            message: "Cron job started successfully and processing scheduled ledger entries"
        }),
        createdAt: new Date().toISOString()
    })

    // Process all scheduled ledger entries
    const processed = await CreditManager.processDailyCreditCron()

    // ✅ Log which requests were processed
    if (processed && processed.length > 0) {
        for (const entry of processed) {
            await dal.create('/items/credits_logs', {
                swapRequestId: entry.swapRequestId,
                hostId: entry.hostId,
                requesteeId: entry.guestId,
                creditsChanged: entry.creditsAmount,
                reason: `cron processed request ${entry.swapRequestId}`,
                details: JSON.stringify({
                    entryId: entry.id,
                    actionType: entry.actionType,
                    status: entry.status,
                    scheduledDate: entry.scheduledDate,
                    processedDate: new Date().toISOString()
                }),
                createdAt: new Date().toISOString()
            })
        }
    } else {
        await dal.create('/items/credits_logs', {
            reason: "cron job completed",
            details: JSON.stringify({
                message: "No pending ledger entries to process today"
            }),
            createdAt: new Date().toISOString()
        })
    }
}

const start = async () => {
    console.log("========== STARTING DAEMON ==========")

    // Set up regular intervals for other daemon tasks
    setInterval(checkNotifications, 1000 * 60 * DAEMON_NOTIFICATION_CHECK_MIN)
    setInterval(checkIncompleteProfiles, 1000 * 60 * 60 * DAEMON_INCOMPLETE_PROFILES_CHECK_HRS)
    setInterval(checkMatches, 1000 * 60 * 60 * DAEMON_INCOMPLETE_PROFILES_CHECK_HRS)

    // Use node-cron to schedule the daily credit cron job for Lisbon time
    // The cron syntax '0 0 * * *' means:
    // 0: at minute 0
    // 0: at hour 0 (midnight)
    // *: every day of the month
    // *: every month
    // *: every day of the week

    // 0 0 * * *
    cron.schedule('*/10 * * * *', async () => {
        console.log("Executing daily credit cron job at 12 AM Lisbon time...")
        try {
            await checkDailyCreditCron()
        } catch (err) {
            console.error("Error running daily credit cron job:", err)
        }
    }, {
        // scheduled: true,
        timezone: "Europe/Lisbon" // Correct timezone for Lisbon, Portugal
    })

    console.log("Daily credit cron job has been scheduled.")
}

export default start