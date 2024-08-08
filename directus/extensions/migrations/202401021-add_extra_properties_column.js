const sqlup = [
    `ALTER TABLE properties ADD COLUMN smokingAllowed BOOLEAN DEFAULT false;`,
    `ALTER TABLE properties ADD COLUMN childrenAllowed BOOLEAN DEFAULT false;`,
    `ALTER TABLE properties ADD COLUMN bedArrangements VARCHAR(1000) DEFAULT "[]";`,
]

const sqldown = [
    `ALTER TABLE properties DROP COLUMN smokingAllowed;`,
    `ALTER TABLE properties DROP COLUMN childrenAllowed;`,
    `ALTER TABLE properties DROP COLUMN bedArrangements;`,
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