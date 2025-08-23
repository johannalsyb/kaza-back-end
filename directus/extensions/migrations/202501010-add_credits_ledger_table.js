const sqlup = [
    `CREATE TABLE credits_ledger (
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
        createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
        updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
        PRIMARY KEY (id),
        CONSTRAINT \`fk_credits_ledger_swap_request\` FOREIGN KEY (swapRequestId) REFERENCES swap_requests (id) ON DELETE CASCADE,
        CONSTRAINT \`fk_credits_ledger_guest\` FOREIGN KEY (guestId) REFERENCES users (id),
        CONSTRAINT \`fk_credits_ledger_host\` FOREIGN KEY (hostId) REFERENCES users (id),
        INDEX idx_credits_ledger_status (status),
        INDEX idx_credits_ledger_scheduled_date (scheduledDate),
        INDEX idx_credits_ledger_swap_request (swapRequestId)
    );`,
]

const sqldown = [
    `DROP TABLE credits_ledger;`,
]

export async function up(knex) {
    for (const sql of sqlup) {
        await knex.raw(sql)
    }
}

export async function down(knex) {
    for (const sql of sqldown) {
        await knex.raw(sql)
    }
}
