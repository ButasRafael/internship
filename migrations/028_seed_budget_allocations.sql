START TRANSACTION;
INSERT INTO budget_allocations
(budget_id, category_id, amount_cents)
VALUES
    (
        (SELECT id FROM budgets
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND period_start='2025-08-01'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Housing'),
        2200000
    ),
    (
        (SELECT id FROM budgets
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND period_start='2025-08-01'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Subscriptions'),
        100000
    ),
    (
        (SELECT id FROM budgets
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND period_start='2025-08-01'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Food'),
        80000
    ),
    (
        (SELECT id FROM budgets
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND period_start='2025-09-01'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND name='Food'),
        150000
    ),
    (
        (SELECT id FROM budgets
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND period_start='2025-09-01'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND name='Subscriptions'),
        50000
    ),
    (
        (SELECT id FROM budgets
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND period_start='2025-10-01'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Housing'),
        1800000
    ),
    (
        (SELECT id FROM budgets
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND period_start='2025-10-01'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Subscriptions'),
        80000
    ),
    (
        (SELECT id FROM budgets
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND period_start='2025-10-01'),
        (SELECT id FROM categories
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Food'),
        120000
    )
ON DUPLICATE KEY UPDATE
                     category_id = VALUES(category_id),
                     amount_cents = VALUES(amount_cents);
COMMIT;
