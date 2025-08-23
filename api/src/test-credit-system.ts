import { CreditManager } from './services/creditManager'

/**
 * Test script for the credit management system
 * Run with: npx ts-node src/test-credit-system.ts
 */

async function testCreditSystem() {
    console.log('Testing Credit Management System...')
    
    try {
        // Test 1: Process daily credit cron
        console.log('\n1. Testing daily credit cron processing...')
        await CreditManager.processDailyCreditCron()
        console.log('✅ Daily credit cron processed successfully')
        
        // Test 2: Get pending ledger entries
        console.log('\n2. Testing pending ledger entries retrieval...')
        const today = new Date().toISOString()
        const pendingEntries = await CreditManager['getPendingLedgerEntries'](today)
        console.log(`✅ Found ${pendingEntries.length} pending ledger entries`)
        
        console.log('\n✅ All tests completed successfully!')
        
    } catch (error) {
        console.error('❌ Test failed:', error)
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testCreditSystem()
}

export { testCreditSystem }
