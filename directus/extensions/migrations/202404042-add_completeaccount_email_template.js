const sqlup = [
    `INSERT INTO translations (id, english) VALUES('complete_profile_email_title','Kazaswap - 🔥 Complete Your Kaza Swap Profile for Full Access')`,
    `INSERT INTO translations (id, english, enabled) VALUES('complete_profile_email','file://assets/emails/complete_profile.html', 1)`,
]

const sqldown = [
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