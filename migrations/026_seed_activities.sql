START TRANSACTION;
INSERT INTO activities
(user_id, category_id, name, duration_minutes, frequency, direct_cost_cents, saved_minutes, currency, notes)
VALUES
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Activities'),
        'Gătit acasă', 60, 'weekly', 3000, 45, 'RON', 'Merită?'
    ),
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Activities'),
        'Bolt spre birou', 20, 'weekly', 2000, 15, 'RON', NULL
    ),
    (
        (SELECT id FROM users WHERE email='bob@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND name='Activities'),
        'Meal prep duminică', 120, 'weekly', 2000, 60, 'RON', 'Prep reduces time during the week'
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Activities'),
        'Curier în loc de mers personal', 40, 'monthly', 2500, 90, 'RON', 'Economisesc 1.5h'
    )
ON DUPLICATE KEY UPDATE
                     category_id         = VALUES(category_id),
                     name                = VALUES(name),
                     duration_minutes    = VALUES(duration_minutes),
                     frequency           = VALUES(frequency),
                     direct_cost_cents   = VALUES(direct_cost_cents),
                     saved_minutes       = VALUES(saved_minutes),
                     currency            = VALUES(currency),
                     notes               = VALUES(notes);
COMMIT;
