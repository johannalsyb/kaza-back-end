const sqlup = [
    `ALTER TABLE swap_requests ADD COLUMN lastMessage JSON DEFAULT NULL;`,
]

const sqldown = [
    `ALTER TABLE swap_requests DROP COLUMN lastMessage;`,
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