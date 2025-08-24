START TRANSACTION;

-- Backfill a baseline hourly rate per user using the earliest month they have data for
-- Falls back to user creation month, then current month
INSERT INTO user_hourly_rates (user_id, effective_month, hourly_rate)
SELECT
    u.id AS user_id,
    DATE_FORMAT(
        COALESCE(t.min_date, DATE(u.created_at), CURRENT_DATE()),
        '%Y-%m-01'
    ) AS effective_month,
    u.hourly_rate
FROM users u
LEFT JOIN (
    SELECT user_id, MIN(min_date) AS min_date
    FROM (
        SELECT user_id, MIN(received_at) AS min_date FROM incomes GROUP BY user_id
        UNION ALL
        SELECT user_id, MIN(start_date)  AS min_date FROM expenses GROUP BY user_id
        UNION ALL
        SELECT user_id, MIN(purchase_date) AS min_date FROM objects GROUP BY user_id
    ) s
    GROUP BY user_id
) t ON t.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_hourly_rates r WHERE r.user_id = u.id
);

COMMIT;

