const sqlup = [
    `UPDATE translations SET english='Kazaswap - You have a new message' WHERE id='notification_swaprequest_message_email_title'`,
    `UPDATE translations SET english='file://assets/emails/new_message.html' WHERE id='notification_swaprequest_message_email'`,
    `UPDATE translations SET enabled=1 WHERE id='notification_swaprequest_message'`,
    `UPDATE translations SET enabled=1 WHERE id='notification_swaprequest_message_email'`,
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