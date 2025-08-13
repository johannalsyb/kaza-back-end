const sqlup = [
    // Add credits column with default 0 so new registrations start with 0 credits
    `ALTER TABLE users ADD COLUMN credits INT NOT NULL DEFAULT 0;`,
]

const sqldown = [
    `ALTER TABLE users DROP COLUMN credits;`,
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


