START TRANSACTION;
INSERT INTO budgets (user_id, period_start, period_end, currency)
VALUES

    ((SELECT id FROM users WHERE email='alice@example.com'), '2025-06-01', '2025-06-30', 'RON'),
    ((SELECT id FROM users WHERE email='alice@example.com'), '2025-07-01', '2025-07-31', 'RON'),
    ((SELECT id FROM users WHERE email='alice@example.com'), '2025-08-01', '2025-08-31', 'RON'),

    ((SELECT id FROM users WHERE email='bob@example.com'),   '2025-05-01', '2025-05-31', 'RON'),
    ((SELECT id FROM users WHERE email='bob@example.com'),   '2025-06-01', '2025-06-30', 'RON'),
    ((SELECT id FROM users WHERE email='bob@example.com'),   '2025-07-01', '2025-07-31', 'RON'),

    ((SELECT id FROM users WHERE email='carol@example.com'), '2025-04-01', '2025-04-30', 'RON'),
    ((SELECT id FROM users WHERE email='carol@example.com'), '2025-05-01', '2025-05-31', 'RON'),
    ((SELECT id FROM users WHERE email='carol@example.com'), '2025-06-01', '2025-06-30', 'RON'),

    ((SELECT id FROM users WHERE email='bob@example.com'),   '2025-09-01', '2025-09-30', 'RON'),
    ((SELECT id FROM users WHERE email='carol@example.com'), '2025-10-01', '2025-10-31', 'RON')
ON DUPLICATE KEY UPDATE
                     period_start = VALUES(period_start),
                     period_end   = VALUES(period_end),
                     currency     = VALUES(currency);
COMMIT;