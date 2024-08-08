const sqlup = [
    `ALTER TABLE users ADD COLUMN payment VARCHAR(255) DEFAULT NULL;`,
]

const sqldown = [
    `ALTER TABLE users DROP COLUMN payment;`,
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