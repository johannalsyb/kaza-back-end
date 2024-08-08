const sqlup = [`
CREATE TABLE swap_requests (
    id VARCHAR(100) NOT NULL,
    \`from\` VARCHAR(100) NOT NULL,
    \`to\` VARCHAR(100) NOT NULL,
    fromProperty VARCHAR(100) NOT NULL,
    toProperty VARCHAR(100) NOT NULL,
    fromAccepted VARCHAR(255) DEFAULT NULL,
    toAccepted VARCHAR(255) DEFAULT NULL,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    status VARCHAR(255) NOT NULL DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT \`fk_from\` FOREIGN KEY (\`from\`) REFERENCES users (id),
    CONSTRAINT \`fk_to\` FOREIGN KEY (\`to\`) REFERENCES users (id),
    CONSTRAINT \`fk_from_property\` FOREIGN KEY (fromProperty) REFERENCES properties (id),
    CONSTRAINT \`fk_to_property\` FOREIGN KEY (toProperty) REFERENCES properties (id)
);`,
`CREATE TABLE swaps (
    id VARCHAR(100) NOT NULL,
    request VARCHAR(100) NOT NULL,
    u1from VARCHAR(255) DEFAULT NULL,
    u1to VARCHAR(255) DEFAULT NULL,
    u2from VARCHAR(255) DEFAULT NULL,
    u2to VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    PRIMARY KEY (id),
    CONSTRAINT \`fk_request\` FOREIGN KEY (request) REFERENCES swap_requests (id)
);`,
]

const sqldown = [
    `DROP TABLE swap_requests;`,
    `DROP TABLE swaps;`,
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