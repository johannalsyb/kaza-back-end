const sqlup = [
    `ALTER TABLE properties ADD COLUMN createdDate DATE DEFAULT (CURDATE());`,
    `UPDATE properties SET createdDate = CAST(SUBSTRING(createdAt,1,10) AS DATE);`
]

const sqldown = [
    `ALTER TABLE properties DROP COLUMN createdDate;`,
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