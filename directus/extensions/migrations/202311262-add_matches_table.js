const sqlup = [
    `CREATE TABLE matches (
        id VARCHAR(100) NOT NULL,
        user VARCHAR(100) NOT NULL,
        property VARCHAR(100) NOT NULL,
        notes TEXT DEFAULT NULL,
        createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
        updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
        lastNotification VARCHAR(100) DEFAULT NULL,
        expired BOOLEAN DEFAULT false,
        deleted BOOLEAN DEFAULT false,
        PRIMARY KEY (id),
        CONSTRAINT \`fk_prop\` FOREIGN KEY (property) REFERENCES properties (id),
        CONSTRAINT \`fk_user\` FOREIGN KEY (user) REFERENCES users (id)
    );`,
    `ALTER TABLE users ADD COLUMN swapLocations TEXT DEFAULT NULL;`,

]

const sqldown = [
    `DROP TABLE matches;`,
    `ALTER TABLE users DROP COLUMN swapLocations;`,
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