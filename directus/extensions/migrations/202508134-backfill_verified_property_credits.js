// Backfill: give +5 credits to every user who already has at least one verified property
// and create one credits log entry per user to keep history consistent.

const sqlup = [
    // 1) Add 5 credits to owners with verified properties, only if we haven't backfilled them yet
    `UPDATE users u
     JOIN (SELECT DISTINCT owner FROM properties WHERE verified = TRUE) v ON v.owner = u.id
     LEFT JOIN credits_logs c ON c.hostId = u.id AND c.reason = 'property verification backfill'
     SET u.credits = u.credits + 5
     WHERE c.hostId IS NULL;`,

    // 2) Insert one log row per owner we just credited (idempotent)
    `INSERT INTO credits_logs (id, hostId, requesteeId, creditsChanged, swapRequestId, reason)
     SELECT REPLACE(UUID(), '-', ''), o.owner, NULL, 5, NULL, 'property verification backfill'
     FROM (SELECT DISTINCT owner FROM properties WHERE verified = TRUE) o
     LEFT JOIN credits_logs c ON c.hostId = o.owner AND c.reason = 'property verification backfill'
     WHERE c.hostId IS NULL;`,
]

const sqldown = [
    // 1) Revert user credits for those impacted by this backfill
    `UPDATE users u
     JOIN (SELECT DISTINCT hostId FROM credits_logs WHERE reason = 'property verification backfill') v ON v.hostId = u.id
     SET u.credits = CASE WHEN u.credits >= 5 THEN u.credits - 5 ELSE 0 END;`,

    // 2) Remove the backfill logs
    `DELETE FROM credits_logs WHERE reason = 'property verification backfill';`,
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


