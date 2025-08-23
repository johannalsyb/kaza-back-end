# Credit Management System

This document describes the new credit management system that handles credit transactions for swap requests with a ledger-based approach and automated cron jobs.

## Overview

The credit management system ensures that:
1. Credits are deducted from guests immediately when they make a swap request
2. Credits are added to hosts only at the end of the swap period (dateTo)
3. Credits are automatically reverted if hosts don't respond or decline requests
4. All transactions are logged in both `credits_logs` and `credits_ledger` tables

## Database Tables

### credits_ledger
New table for tracking pending credit transactions:

```sql
CREATE TABLE credits_ledger (
    id VARCHAR(100) NOT NULL,
    swapRequestId VARCHAR(100) NOT NULL,
    guestId VARCHAR(100) NOT NULL,
    hostId VARCHAR(100) NOT NULL,
    creditsAmount INT NOT NULL,
    status ENUM('pending', 'completed', 'reverted') NOT NULL DEFAULT 'pending',
    actionType ENUM('deduct_guest', 'add_host', 'revert_guest') NOT NULL,
    scheduledDate VARCHAR(255) NOT NULL,
    processedDate VARCHAR(255) NULL,
    reason VARCHAR(255) NOT NULL,
    details TEXT NULL,
    createdAt VARCHAR(255) NOT NULL,
    updatedAt VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (swapRequestId) REFERENCES swap_requests (id) ON DELETE CASCADE,
    FOREIGN KEY (guestId) REFERENCES users (id),
    FOREIGN KEY (hostId) REFERENCES users (id)
);
```

## Credit Flow Scenarios

### 1. Successful Swap Request (Accepted by Host)
**Example**: Guest requests swap for Sep 1-5 (4 nights)

1. **Immediate**: Credits deducted from guest
2. **Ledger Entry Created**: Host credit addition scheduled for Sep 5
3. **Host Accepts**: Ledger entry remains pending until Sep 5
4. **Sep 5 (Cron Job)**: Credits added to host, ledger marked as completed

**Log Messages**:
- `swap_request_deduction`: Credits deducted from guest
- `swap_request_completed`: Credits added to host

### 2. Host No Response by Deadline
**Example**: Guest requests swap for Sep 1-7 (6 nights), host doesn't respond

1. **Immediate**: Credits deducted from guest
2. **Ledger Entry Created**: Host credit addition scheduled for Sep 7
3. **Sep 7 (Cron Job)**: Credits reverted to guest, ledger marked as reverted

**Log Messages**:
- `swap_request_deduction`: Credits deducted from guest
- `host_no_response_by_deadline`: Credits reverted to guest

### 3. Host Declines Request
**Example**: Guest requests swap, host declines immediately

1. **Immediate**: Credits deducted from guest
2. **Host Declines**: Credits immediately reverted to guest
3. **Ledger Entry**: Marked as reverted

**Log Messages**:
- `swap_request_deduction`: Credits deducted from guest
- `host_declined_swap_request`: Credits reverted to guest

## Cron Job

The system includes a daily cron job that runs at 12 AM (midnight) to process pending credit transactions:

### Location
- **File**: `api/src/daemon/index.ts`
- **Function**: `checkDailyCreditCron()`
- **Schedule**: Daily at 12 AM

### What it does:
1. Finds all pending ledger entries scheduled for today or earlier
2. Processes each entry based on swap request status:
   - **Pending**: Reverts credits to guest (host didn't respond)
   - **Accepted**: Adds credits to host (swap completed)
   - **Declined**: Marks as reverted (already handled)

## API Endpoints

### Admin Routes
- `GET /admin/credits-ledger` - View ledger entries with pagination
- `POST /admin/credits-ledger/process-pending` - Manually trigger pending credit processing

### Query Parameters for Ledger View
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `status`: Filter by status (pending/completed/reverted)
- `swapRequestId`: Filter by specific swap request

## Implementation Files

### Core Service
- `api/src/services/creditManager.ts` - Main credit management logic

### Database Migration
- `directus/extensions/migrations/202501010-add_credits_ledger_table.js` - Creates ledger table

### Updated Files
- `api/src/routes/swaps.ts` - Updated swap request logic
- `api/src/routes/admin.ts` - Added ledger viewing endpoints
- `api/src/daemon/index.ts` - Added daily cron job

## Error Handling

The system includes comprehensive error handling:
- Credit processing failures rollback swap request creation
- Database transaction failures are logged
- Cron job errors don't stop processing of other entries
- Insufficient credit checks prevent invalid transactions

## Monitoring

Monitor the system through:
1. **Logs**: Check console for cron job execution logs
2. **Database**: Query `credits_ledger` table for pending transactions
3. **Admin Panel**: Use `/admin/credits-ledger` endpoint to view entries
4. **Credits Logs**: Check `credits_logs` table for all credit transactions

## Testing

To test the system:
1. Create a swap request and verify credits are deducted
2. Check ledger table for pending entry
3. Accept/decline request and verify appropriate actions
4. Wait for cron job or manually trigger with admin endpoint
5. Verify final credit balances and ledger status
