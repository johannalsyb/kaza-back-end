const sqlup = [
    `ALTER TABLE matches ADD COLUMN seen BOOLEAN DEFAULT 0;`,

]

const sqldown = [
    `ALTER TABLE matches DROP COLUMN seen;`,
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