START TRANSACTION;
INSERT INTO incomes
(user_id, received_at, amount_cents, currency, source, recurring, notes)
VALUES
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        '2025-08-01 09:00:00', 2000000, 'RON', 'salary',   'monthly', 'Salary August'
    ),
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        '2025-08-15 12:00:00',  200000, 'RON', 'freelance','none',    'Side gig'
    ),
    (
        (SELECT id FROM users WHERE email='bob@example.com'),
        '2025-09-01 09:00:00', 1500000, 'RON', 'salary', 'monthly', 'Salary September'
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        '2025-10-01 09:00:00', 2500000, 'RON', 'salary', 'monthly', 'Salary October'
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        '2025-10-10 17:00:00',  500000, 'RON', 'bonus',  'none',    'Performance bonus'
    )
ON DUPLICATE KEY UPDATE
                     amount_cents = VALUES(amount_cents),
                     recurring    = VALUES(recurring),
                     notes        = VALUES(notes);
COMMIT;
