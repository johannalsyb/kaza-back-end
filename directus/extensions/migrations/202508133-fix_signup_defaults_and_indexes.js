const sqlup = [
    // Indexes for better lookup performance
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);`,
    `CREATE INDEX IF NOT EXISTS idx_credits_logs_host ON credits_logs (hostId);`,
    `CREATE INDEX IF NOT EXISTS idx_credits_logs_requestee ON credits_logs (requesteeId);`,
    `CREATE INDEX IF NOT EXISTS idx_credits_logs_createdAt ON credits_logs (createdAt);`,
]

const sqldown = [
    `DROP INDEX IF EXISTS idx_users_role ON users;`,
    `DROP INDEX IF EXISTS idx_credits_logs_host ON credits_logs;`,
    `DROP INDEX IF EXISTS idx_credits_logs_requestee ON credits_logs;`,
    `DROP INDEX IF EXISTS idx_credits_logs_createdAt ON credits_logs;`,
]

export async function up(knex) {
    for (const sql of sqlup) {
        try { await knex.raw(sql) } catch (e) {}
    }
}

export async function down(knex) {
    for (const sql of sqldown) {
        try { await knex.raw(sql) } catch (e) {}
    }
}


