import { dal } from '../dal'
import { SwapRequest } from '../../../common/src/types/SwapRequest'
import { User } from '../../../common/src/types/User'
import { randomUUID } from 'crypto'

export interface CreditLedgerEntry {
    id: string
    swapRequestId: string
    guestId: string
    hostId: string
    creditsAmount: number
    status: 'pending' | 'completed' | 'reverted'
    actionType: 'deduct_guest' | 'add_host' | 'revert_guest'
    scheduledDate: string
    processedDate?: string
    reason: string
    details?: string
    createdAt: string
    updatedAt: string
}

export class CreditManager {

    //   Process swap request and create ledger entries

    static async processSwapRequest(swapRequest: SwapRequest): Promise<void> {
        const nights = parseInt(swapRequest.nights || '1', 10)
        
        console.log("Processing swap request:", {
            id: swapRequest.id,
            dateTo: swapRequest.dateTo,
            nights: nights
        });
        
        // Validate dateTo
        if (!swapRequest.dateTo) {
            throw new Error('dateTo is required for swap request processing')
        }
        
        let dateTo: Date;
        try {
            dateTo = new Date(swapRequest.dateTo);
            console.log("Parsed dateTo:", {
                original: swapRequest.dateTo,
                parsed: dateTo,
                isValid: !isNaN(dateTo.getTime())
            });
            
            if (isNaN(dateTo.getTime())) {
                // Try parsing as ISO string if it's not already
                const isoDate = new Date(swapRequest.dateTo + 'T00:00:00.000Z');
                if (!isNaN(isoDate.getTime())) {
                    dateTo = isoDate;
                    console.log("Successfully parsed as ISO date:", dateTo.toISOString());
                } else {
                    throw new Error(`Invalid dateTo format: ${swapRequest.dateTo}`)
                }
            }
        } catch (dateError) {
            console.error("Date parsing error:", dateError);
            throw new Error(`Failed to parse dateTo: ${swapRequest.dateTo}`)
        }

        // Deduct credits from guest immediately
        await this.deductCreditsFromGuest(swapRequest.from, nights)

        // Create ledger entry for host credit addition (scheduled for dateTo)
        await this.createLedgerEntry({
            swapRequestId: swapRequest.id,
            guestId: swapRequest.from,
            hostId: swapRequest.to,
            creditsAmount: nights,
            actionType: 'add_host',
            scheduledDate: dateTo.toISOString(),
            reason: 'swap_request_accepted',
            details: JSON.stringify({
                type: 'swap_request',
                nights,
                fromProperty: swapRequest.fromProperty,
                toProperty: swapRequest.toProperty,
                dateFrom: swapRequest.dateFrom,
                dateTo: swapRequest.dateTo
            })
        })

        // Log the immediate deduction
        await dal.create('/items/credits_logs', {
            hostId: swapRequest.to,
            requesteeId: swapRequest.from,
            creditsChanged: -nights,
            swapRequestId: swapRequest.id,
            reason: 'swap_request_deduction',
            details: JSON.stringify({
                type: 'swap_request_deduction',
                nights,
                immediate: true
            }),
            createdAt: new Date().toISOString()
        })
    }


    //   Handle swap request acceptance

    static async handleSwapAcceptance(swapRequest: SwapRequest): Promise<void> {
        // Update ledger entry to mark as accepted
        const ledgerEntries = await this.getLedgerEntriesBySwapRequest(swapRequest.id)
        const addHostEntry = ledgerEntries.find(entry => entry.actionType === 'add_host' && entry.status === 'pending')

        if (addHostEntry) {
            await this.updateLedgerEntry(addHostEntry.id, {
                status: 'pending', // Keep pending until dateTo
                reason: 'swap_request_accepted',
                updatedAt: new Date().toISOString()
            })
        }
    }


    //  Handle swap request decline/cancellation

    static async handleSwapDecline(swapRequest: SwapRequest, declinedBy: string): Promise<void> {
        const nights = parseInt(swapRequest.nights || '1', 10)
        const isHostDecline = declinedBy === swapRequest.to

        if (isHostDecline) {
            // Host declined - revert credits to guest immediately
            await this.revertCreditsToGuest(swapRequest.from, nights)

            // Update ledger entries
            await this.updateLedgerEntriesForSwapRequest(swapRequest.id, {
                status: 'reverted',
                reason: 'host_declined_swap_request',
                processedDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })

            // Log the reversion
            await dal.create('/items/credits_logs', {
                hostId: swapRequest.to,
                requesteeId: swapRequest.from,
                creditsChanged: nights,
                swapRequestId: swapRequest.id,
                reason: 'host_declined_swap_request',
                details: JSON.stringify({
                    type: 'host_declined_swap_request',
                    nights,
                    declinedBy
                }),
                createdAt: new Date().toISOString()
            })
        }
    }


    //   Process daily cron job for credit management

    static async processDailyCreditCron(): Promise<CreditLedgerEntry[]> {
        console.log('========== Processing daily credit cron job')

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISO = today.toISOString()

        // Get all pending ledger entries scheduled for today or earlier
        const pendingEntries = await this.getPendingLedgerEntries(todayISO)

        const processed: CreditLedgerEntry[] = []

        for (const entry of pendingEntries) {
            try {
                await this.processLedgerEntry(entry)
                processed.push(entry)
            } catch (error) {
                console.error(`Error processing ledger entry ${entry.id}:`, error)
            }
        }
        return processed
    }


    //  Process individual ledger entry

    private static async processLedgerEntry(entry: CreditLedgerEntry): Promise<void> {
        const swapRequest = await dal.get<SwapRequest>(`/items/swap_requests/${entry.swapRequestId}`)

        if (!swapRequest) {
            // Swap request doesn't exist, mark as reverted
            await this.updateLedgerEntry(entry.id, {
                status: 'reverted',
                reason: 'swap_request_not_found',
                processedDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
            return
        }

        // Check if swap request is still pending
        if (swapRequest.status === 'pending') {
            // Host didn't respond by dateTo - revert credits to guest
            await this.revertCreditsToGuest(entry.guestId, entry.creditsAmount)

            await this.updateLedgerEntry(entry.id, {
                status: 'reverted',
                reason: 'host_no_response_by_deadline',
                processedDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })

            // Log the reversion
            await dal.create('/items/credits_logs', {
                hostId: entry.hostId,
                requesteeId: entry.guestId,
                creditsChanged: entry.creditsAmount,
                swapRequestId: entry.swapRequestId,
                reason: 'host_no_response_by_deadline',
                details: JSON.stringify({
                    type: 'host_no_response_by_deadline',
                    creditsAmount: entry.creditsAmount,
                    scheduledDate: entry.scheduledDate
                }),
                createdAt: new Date().toISOString()
            })
        } else if (swapRequest.status === 'accepted') {
            // Swap was accepted - add credits to host
            await this.addCreditsToHost(entry.hostId, entry.creditsAmount)

            await this.updateLedgerEntry(entry.id, {
                status: 'completed',
                reason: 'swap_request_completed',
                processedDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })

            // Log the completion
            await dal.create('/items/credits_logs', {
                hostId: entry.hostId,
                requesteeId: entry.guestId,
                creditsChanged: entry.creditsAmount,
                swapRequestId: entry.swapRequestId,
                reason: 'swap_request_completed',
                details: JSON.stringify({
                    type: 'swap_request_completed',
                    creditsAmount: entry.creditsAmount,
                    scheduledDate: entry.scheduledDate
                }),
                createdAt: new Date().toISOString()
            })
        } else if (swapRequest.status === 'declined') {
            // Swap was declined - credits should already be reverted
            await this.updateLedgerEntry(entry.id, {
                status: 'reverted',
                reason: 'swap_request_declined',
                processedDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        }
    }


    //  Deduct credits from guest

    private static async deductCreditsFromGuest(guestId: string, amount: number): Promise<void> {
        const guest = await dal.get<User>(`/items/users/${guestId}?fields=credits`)
        const currentCredits = (guest as any)?.credits ?? 0

        if (currentCredits < amount) {
            throw new Error(`Insufficient credits: ${currentCredits} available, ${amount} required`)
        }

        await dal.update<User>(`/items/users/${guestId}`, {
            credits: currentCredits - amount
        })
    }


    //  Add credits to host

    private static async addCreditsToHost(hostId: string, amount: number): Promise<void> {
        const host = await dal.get<User>(`/items/users/${hostId}?fields=credits`)
        const currentCredits = (host as any)?.credits ?? 0

        await dal.update<User>(`/items/users/${hostId}`, {
            credits: currentCredits + amount
        })
    }


    //  Revert credits to guest

    private static async revertCreditsToGuest(guestId: string, amount: number): Promise<void> {
        const guest = await dal.get<User>(`/items/users/${guestId}?fields=credits`)
        const currentCredits = (guest as any)?.credits ?? 0

        await dal.update<User>(`/items/users/${guestId}`, {
            credits: currentCredits + amount
        })
    }


    //  Create ledger entry

    private static async createLedgerEntry(data: Partial<CreditLedgerEntry>): Promise<void> {
        await dal.create('/items/credits_ledger', {
            id: data.id || randomUUID(),
            swapRequestId: data.swapRequestId!,
            guestId: data.guestId!,
            hostId: data.hostId!,
            creditsAmount: data.creditsAmount!,
            status: data.status || 'pending',
            actionType: data.actionType!,
            scheduledDate: data.scheduledDate!,
            reason: data.reason!,
            details: data.details,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
    }


    //   Update ledger entry

    private static async updateLedgerEntry(id: string, updates: Partial<CreditLedgerEntry>): Promise<void> {
        await dal.update(`/items/credits_ledger/${id}`, {
            ...updates,
            updatedAt: new Date().toISOString()
        })
    }


    //  Update all ledger entries for a swap request

    private static async updateLedgerEntriesForSwapRequest(swapRequestId: string, updates: Partial<CreditLedgerEntry>): Promise<void> {
        const entries = await this.getLedgerEntriesBySwapRequest(swapRequestId)

        for (const entry of entries) {
            await this.updateLedgerEntry(entry.id, updates)
        }
    }


    //  Get ledger entries by swap request ID

    private static async getLedgerEntriesBySwapRequest(swapRequestId: string): Promise<CreditLedgerEntry[]> {
        return await dal.find<CreditLedgerEntry>(`/items/credits_ledger?filter=${encodeURIComponent(JSON.stringify({ swapRequestId }))}`)
    }


    //  Get pending ledger entries scheduled for a specific date or earlier

    private static async getPendingLedgerEntries(dateISO: string): Promise<CreditLedgerEntry[]> {
        return await dal.find<CreditLedgerEntry>(`/items/credits_ledger?filter=${encodeURIComponent(JSON.stringify({
            status: 'pending',
            scheduledDate: { _lte: dateISO }
        }))}`)
    }
}
