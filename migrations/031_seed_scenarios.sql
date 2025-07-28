START TRANSACTION;
INSERT INTO scenarios
(user_id, name, params_json)
VALUES
    (
        (SELECT id FROM users WHERE email='alice@example.com'),
        'Trec la 150 RON/h',
        '{"new_hourly_rate":150,"compare":"current"}'
    ),
    (
        (SELECT id FROM users WHERE email='bob@example.com'),
        'Reduc cheltuieli cu 20%',
        '{"cut_expenses_percent":0.2}'
    ),
    (
        (SELECT id FROM users WHERE email='carol@example.com'),
        'Trec pe 4 zile/săpt.',
        '{"work_days_per_week":4,"expected_rate":140}'
    )
ON DUPLICATE KEY UPDATE
    params_json = VALUES(params_json);

COMMIT;
