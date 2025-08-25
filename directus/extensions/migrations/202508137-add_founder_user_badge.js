const sqlup = [
    `ALTER TABLE users ADD COLUMN badgeName VARCHAR(100) DEFAULT NULL;`
]

const sqldown = [
    `ALTER TABLE users DROP COLUMN badgeName;`
]

export async function up(knex) {
    for (const sql of sqlup) {
        try { 
            await knex.raw(sql) 
        } catch (e) {}
    }
}

export async function down(knex) {
    for (const sql of sqldown) {
        try { 
            await knex.raw(sql) 
        } catch (e) {}
    }
}
