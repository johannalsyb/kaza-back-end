const sqlup = [
    `INSERT INTO translations (id, english) VALUES
    ('notification_swaprequest_new', '*New Swap Request*\n\nTo know more, please click (HERE)[%url%]\n\nHappy swapping ! ✈️'),
    ('notification_swaprequest_new_email', '<p>Hi %firstName%,</p><p>Congratulations, you have received a new Swap Request on Kaza Swap !</p><p>To know more, please click <a href="%url%" target="_blank" rel="noopener">HERE</a></p><p>Or open the following link: %url%</p><p>Happy swapping ! ✈️</p>'),
    ('notification_swaprequest_new_email_title', 'Kaza Swap - You have a new Swap Request'),
    ('notification_swaprequest_new_sms', 'You have received a new swap request on Kaza Swap. Open this link to view it %url%'),
    ('notification_swaprequest_message', '*New message received*\nYou have a new message in your inbox.'),
    ('notification_swaprequest_message_email', '<p>Hi %firstName%,</p><p>You have received a new message on Kaza Swap.</p><p>To view it, click <a href="%url%" target="_blank" rel="noopener">HERE</a></p><p>Or open the following link: %url%</p><p>Happy swapping ! ✈️</p>'),
    ('notification_swaprequest_message_email_title', 'Kaza Swap - You have a new message'),
    ('notification_swaprequest_message_sms', ''),
    ('notification_swaprequest_accepted', '*Swap Request accepted*\n\nTo know more, please click (HERE)[%url%]\n\nHappy swapping ! ✈️'),
    ('notification_swaprequest_accepted_email', '<p>Hi %firstName%,</p><p>Congratulations, your Swap Request has been accepted !</p><p>To know more, please click <a href="%url%" target="_blank" rel="noopener">HERE</a></p><p>Or open the following link: %url%</p><p>Happy swapping ! ✈️</p>'),
    ('notification_swaprequest_accepted_email_title', 'Kaza Swap - Congratulations, you Swap Request has been accepted !'),
    ('notification_swaprequest_accepted_sms', 'Your swap request has been accepted. Open this link to know more %url%'),
    ('notification_swaprequest_declined', '*Swap Request declined*\nOpen your swap request history to know more.'),
    ('notification_swaprequest_declined_email', '<p>Hi %firstName%,</p><p>We are sorry to inform you that your Swap Request has been declined.</p><p>Visit your Kaza Swap profile to know more.</p><p>Happy swapping ! ✈️</p>'),
    ('notification_swaprequest_declined_email_title', 'Kaza Swap - Swap Request declined'),
    ('notification_swaprequest_declined_sms', 'Your swap request has been declined. Open Kaza Swap to know more');`,
    `ALTER TABLE translations ADD COLUMN enabled BOOLEAN DEFAULT true;`,
]

const sqldown = [
    `ALTER TABLE translations DROP COLUMN enabled;`,
    `DELETE FROM translations WHERE id LIKE 'notification_swaprequest_%';`,
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