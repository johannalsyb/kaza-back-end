const sqlup = [
    `CREATE TABLE blog (
        slug VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        image VARCHAR(255) DEFAULT NULL,
        content TEXT DEFAULT NULL,
        createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
        updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
        visible BOOLEAN DEFAULT true,
        PRIMARY KEY (slug)
    );`,
]

const sqldown = [
    `DROP TABLE blog;`,
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