START TRANSACTION;
INSERT INTO notifications
(alert_id, sent_at, channel, payload_json)
VALUES
    (
        (SELECT id FROM alerts
         WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com')
           AND name='Cheltuieli > 30% din venit'),
        '2025-08-10 09:00:00',
        'email',
        '{"msg":"Depășești 30% din venitul lunar!"}'
    ),
    (
        (SELECT id FROM alerts
         WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com')
           AND name='Buget Food > 1000 RON'),
        '2025-09-15 09:00:00',
        'email',
        '{"msg":"Ai depășit bugetul la Food!"}'
    ),
    (
        (SELECT id FROM alerts
         WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com')
           AND name='Obiect amortizat'),
        '2025-10-20 09:00:00',
        'email',
        '{"msg":"MacBook aproape amortizat!"}'
    )
ON DUPLICATE KEY UPDATE
                     channel      = VALUES(channel),
                     payload_json = VALUES(payload_json);
COMMIT;
