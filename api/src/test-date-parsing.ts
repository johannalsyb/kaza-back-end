/**
 * Test date parsing with the provided payload format
 */

function testDateParsing() {
    console.log('Testing date parsing...');
    
    const testDates = [
        '2025-08-23',
        '2025-08-24',
        '2025-12-31',
        '2024-02-29' // leap year
    ];
    
    testDates.forEach(dateStr => {
        const date = new Date(dateStr);
        const isValid = !isNaN(date.getTime());
        
        console.log(`Date: ${dateStr}`);
        console.log(`  Parsed: ${date.toISOString()}`);
        console.log(`  Valid: ${isValid}`);
        console.log(`  Time: ${date.getTime()}`);
        console.log('---');
    });
    
    // Test the specific dates from the payload
    console.log('\nTesting payload dates:');
    const dateFrom = '2025-08-23';
    const dateTo = '2025-08-24';
    
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    
    console.log(`dateFrom: ${dateFrom} -> ${startDate.toISOString()} (valid: ${!isNaN(startDate.getTime())})`);
    console.log(`dateTo: ${dateTo} -> ${endDate.toISOString()} (valid: ${!isNaN(endDate.getTime())})`);
    
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const timeDiff = endDate.getTime() - startDate.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        console.log(`Nights calculated: ${nights}`);
    }
}

if (require.main === module) {
    testDateParsing();
}

export { testDateParsing };
