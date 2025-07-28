START TRANSACTION;
INSERT INTO expenses
(user_id, category_id, name, amount_cents, currency, frequency, start_date, end_date, is_active, notes)
VALUES
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Subscriptions'),
        'Netflix', 5999, 'RON', 'monthly', '2025-08-01', NULL, 1, NULL
    ),
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Housing'),
        'Chirie', 220000, 'RON', 'monthly', '2025-08-01', NULL, 1, NULL
    ),
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Food'),
        'Kaufland', 12000, 'RON', 'weekly',  '2025-08-01', NULL, 1, 'Grocery'
    ),
    (
        (SELECT id FROM users WHERE email='bob@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND name='Subscriptions'),
        'HBO Max', 2999, 'RON', 'monthly', '2025-08-01', NULL, 1, NULL
    ),
    (
        (SELECT id FROM users WHERE email='bob@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND name='Food'),
        'Glovo', 8000, 'RON', 'weekly', '2025-08-01', NULL, 1, 'Food delivery'
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Subscriptions'),
        'Spotify', 2799, 'RON', 'monthly', '2025-08-01', NULL, 1, NULL
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Housing'),
        'Chirie', 180000, 'RON', 'monthly', '2025-08-01', NULL, 1, NULL
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Food'),
        'Mega', 10000, 'RON', 'weekly', '2025-08-01', NULL, 1, NULL
    )
ON DUPLICATE KEY UPDATE
                     category_id  = VALUES(category_id),
                     amount_cents = VALUES(amount_cents),
                     currency     = VALUES(currency),
                     frequency    = VALUES(frequency),
                     start_date   = VALUES(start_date),
                     end_date     = VALUES(end_date),
                     is_active    = VALUES(is_active),
                     notes        = VALUES(notes);
COMMIT;
