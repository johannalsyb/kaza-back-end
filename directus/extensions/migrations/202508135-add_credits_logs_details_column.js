const sqlup = [
    `ALTER TABLE credits_logs ADD COLUMN details TEXT NULL;`
]

const sqldown = [
    `ALTER TABLE credits_logs DROP COLUMN details;`
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


