START TRANSACTION;
INSERT INTO objects
(user_id, category_id, name, price_cents, currency, purchase_date, expected_life_months, maintenance_cents_per_month, hours_saved_per_month, notes)
VALUES
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Objects'),
        'Espressor', 120000, 'RON', '2025-07-01', 24, 0, 2.5, 'face cafea rapid'
    ),
    (
        (SELECT id FROM users WHERE email='bob@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND name='Objects'),
        'Bicicletă', 150000, 'RON', '2025-04-10', 60, 0, 3.0, 'Economisesc transport'
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Objects'),
        'MacBook Pro', 1200000, 'RON', '2025-05-01', 48, 0, 4.0, 'Boost la productivitate'
    )
ON DUPLICATE KEY UPDATE
                     category_id                  = VALUES(category_id),
                     name                         = VALUES(name),
                     price_cents                  = VALUES(price_cents),
                     currency                     = VALUES(currency),
                     purchase_date                = VALUES(purchase_date),
                     expected_life_months         = VALUES(expected_life_months),
                     maintenance_cents_per_month  = VALUES(maintenance_cents_per_month),
                     hours_saved_per_month        = VALUES(hours_saved_per_month),
                     notes                        = VALUES(notes);
COMMIT;
