START TRANSACTION;
INSERT INTO alerts
(user_id, name, rule_type, rule_config, is_active)
VALUES
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        'Cheltuieli > 30% din venit',
        'percent_expenses_of_income',
        '{"threshold":0.3}',
        1
    ),
    (
        (SELECT id FROM users WHERE email='bob@example.com'),
        'Buget Food > 1000 RON',
        'budget_overrun',
        '{"category":"Food","limit_cents":100000}',
        1
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        'Obiect amortizat',
        'object_breakeven_reached',
        '{"object_name":"MacBook Pro"}',
        1
    )
ON DUPLICATE KEY UPDATE
                     rule_type   = VALUES(rule_type),
                     rule_config = VALUES(rule_config),
                     is_active   = VALUES(is_active),
                     name        = VALUES(name);
COMMIT;
