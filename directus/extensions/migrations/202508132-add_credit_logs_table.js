const sqlup = [
    `CREATE TABLE credits_logs (
        id VARCHAR(100) NOT NULL,
        hostId VARCHAR(100) NOT NULL,
        requesteeId VARCHAR(100) NULL,
        creditsChanged INT NOT NULL,
        swapRequestId VARCHAR(100) NULL,
        reason VARCHAR(255) NULL,
        createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
        PRIMARY KEY (id),
        CONSTRAINT \`fk_credits_logs_host\` FOREIGN KEY (hostId) REFERENCES users (id),
        CONSTRAINT \`fk_credits_logs_requestee\` FOREIGN KEY (requesteeId) REFERENCES users (id),
        CONSTRAINT \`fk_credits_logs_swap_request\` FOREIGN KEY (swapRequestId) REFERENCES swap_requests (id)
    );`,
]

const sqldown = [
    `DROP TABLE credits_logs;`,
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


