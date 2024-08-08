const sqlup = [`
CREATE TABLE users (
    id VARCHAR(100) NOT NULL,
    email VARCHAR(50) NOT NULL,
    emailVerified BOOLEAN NOT NULL DEFAULT false,
    phone VARCHAR(50) NOT NULL,
    phoneVerified BOOLEAN NOT NULL DEFAULT false,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL DEFAULT '',
    verified BOOLEAN NOT NULL DEFAULT false,
    images TEXT NOT NULL DEFAULT '',
    primaryImage TEXT NOT NULL DEFAULT '',
    role VARCHAR(255) NOT NULL DEFAULT 'user',
    orgs TEXT NOT NULL DEFAULT '',
    about TEXT NOT NULL DEFAULT '',
    job VARCHAR(255) NOT NULL DEFAULT '',
    hobby VARCHAR(3000) NOT NULL DEFAULT '',
    socialMedia VARCHAR(3000) NOT NULL DEFAULT '',
    ambassadorCode VARCHAR(255) NOT NULL DEFAULT '',
    gender VARCHAR(255) NOT NULL DEFAULT '',
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    PRIMARY KEY (id)
);`,
`CREATE TABLE orgs (
    id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    PRIMARY KEY (id),
    CONSTRAINT \`fk_creator\` FOREIGN KEY (owner) REFERENCES users (id)
);`,
`CREATE TABLE property_type (
    id VARCHAR(100) NOT NULL,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    PRIMARY KEY (id)
);`,
`INSERT INTO property_type (id) VALUES ('flat'), ('house'), ('room'), ('studio');`,
`CREATE TABLE properties (
    id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    amenities TEXT NOT NULL DEFAULT '',
    attractiveness INTEGER DEFAULT NULL,
    images TEXT NOT NULL DEFAULT '',
    primaryImage TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    dateDuration VARCHAR(255) DEFAULT NULL,
    datePreference VARCHAR(255) DEFAULT NULL,
    dateRanges TEXT DEFAULT NULL,
    flatmates INTEGER DEFAULT 0,
    address VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    region VARCHAR(255) DEFAULT NULL,
    city VARCHAR(255) NOT NULL,
    lat DOUBLE NOT NULL,
    lon DOUBLE NOT NULL,
    approxLat DOUBLE NOT NULL,
    approxLon DOUBLE NOT NULL,
    bathrooms INTEGER DEFAULT 1,
    bedrooms INTEGER DEFAULT 1,
    beds INTEGER DEFAULT 1,
    pets BOOLEAN DEFAULT false,
    private BOOLEAN DEFAULT false,
    verified BOOLEAN NOT NULL DEFAULT false,
    sizeM2 INTEGER DEFAULT 0,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    PRIMARY KEY (id),
    CONSTRAINT \`fk_owner\` FOREIGN KEY (owner) REFERENCES users (id),
    CONSTRAINT \`fk_type\` FOREIGN KEY (type) REFERENCES property_type (id)
);`,
`CREATE TABLE temp (
    id VARCHAR(100) NOT NULL,
    type VARCHAR(255) NOT NULL,
    expiry BIGINT NOT NULL,
    data TEXT DEFAULT NULL,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    PRIMARY KEY (id)
);`,
`CREATE TABLE translations (
    id VARCHAR(100) NOT NULL,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    english TEXT NOT NULL DEFAULT '',
    french TEXT DEFAULT NULL,
    spanish TEXT DEFAULT NULL,
    portuguese TEXT DEFAULT NULL,
    italian TEXT DEFAULT NULL,
    PRIMARY KEY (id)
);`,
`INSERT INTO translations (id, english) VALUES
    ('email_welcome_title', 'Welcome to Kaza Swap !'),
    ('email_welcome', '<p>Hi %firstName%,</p><p>Welcome to Kaza Swap !</p><p>To verify your account, please click <a href="%url%" target="_blank" rel="noopener">HERE</a></p><p>Or open the following link: %url%</p><p>Happy swapping ! ✈️</p>'),
    ('email_resetpassword_title', 'Kaza Swap - Reset password'),
    ('email_resetpassword', '<p>Hi,</p><p>To reset your password, please click <a href="%url%" target="_blank" rel="noopener">HERE</a></p><p>Or open the following link: %url%</p><p>Happy swapping ! ✈️</p>'),
    ('sms_verify', 'To verify your account, open %url%')
;`
]

const sqldown = [
    `DROP TABLE users;`,
    `DROP TABLE orgs;`,
    `DROP TABLE property_type;`,
    `DROP TABLE properties;`,
    `DROP TABLE temp;`,
    `DROP TABLE translations;`,
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