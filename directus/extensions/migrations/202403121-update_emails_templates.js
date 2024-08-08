const sqlup = [
    `UPDATE translations SET english='Kazaswap - Reset Password' WHERE id='email_resetpassword_title'`,
    `UPDATE translations SET english='file://assets/emails/reset_password.html' WHERE id='email_resetpassword'`,

    `UPDATE translations SET english='Welcome to Kazaswap!' WHERE id='email_welcome_title'`,
    `UPDATE translations SET english='file://assets/emails/confirmation.html' WHERE id='email_welcome'`,

    `UPDATE translations SET english='Kazaswap - You have a new Swap Request' WHERE id='notification_swaprequest_new_email_title'`,
    `UPDATE translations SET english='file://assets/emails/new_swap_request.html' WHERE id='notification_swaprequest_new_email'`,

    `INSERT INTO translations (id, english) VALUES('account_approved_email_title', 'Kazaswap - Your account has been approved')`,
    `INSERT INTO translations (id, english) VALUES('account_approved_email', 'file://assets/emails/account_approved.html')`,

    `INSERT INTO translations (id, english) VALUES('launch_reset_email_title', 'Welcome to Kazaswap - Dive into Our New Version!')`,
    `INSERT INTO translations (id, english) VALUES('launch_reset_email', 'file://assets/emails/launch_reset_email.html')`,

    `UPDATE translations SET enabled=0 WHERE id='notification_swaprequest_message_email'`,
    `UPDATE translations SET enabled=0 WHERE id='notification_swaprequest_accepted_email'`,
    `UPDATE translations SET enabled=0 WHERE id='notification_swaprequest_declined_email'`,
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