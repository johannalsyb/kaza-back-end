const sqlup = [`
ALTER TABLE properties 
ADD COLUMN availebleDates JSON DEFAULT (JSON_ARRAY())
`]

const sqldown = [`
ALTER TABLE properties DROP COLUMN availebleDates
`]

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
