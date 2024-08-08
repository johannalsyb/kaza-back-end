const sqlup = [
    `ALTER TABLE users ADD COLUMN languagePref VARCHAR(255) DEFAULT 'english';`,
]

const sqldown = [
    `ALTER TABLE users DROP COLUMN languagePref;`,
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