const sqlup = [
    `ALTER TABLE users ADD COLUMN dateFrom BIGINT DEFAULT NULL;`,
    `ALTER TABLE users ADD COLUMN dateTo BIGINT DEFAULT NULL;`,
]

const sqldown = [
    `ALTER TABLE users DROP COLUMN dateFrom;`,
    `ALTER TABLE users DROP COLUMN dateTo;`,
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