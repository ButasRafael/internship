START TRANSACTION;
INSERT INTO goals (user_id, name, target_amount_cents, target_hours, deadline_date, priority, status, currency)
VALUES
    ((SELECT id FROM users WHERE email='alice@example.com'),'Fond de urgență', 1000000, NULL, '2026-06-01', 1, 'active', 'RON'),
    ((SELECT id FROM users WHERE email='bob@example.com'),'Vacanță Mare',     300000,  NULL, '2026-08-01', 2, 'active', 'RON'),
    ((SELECT id FROM users WHERE email='carol@example.com'),'Avans apartament',3000000, NULL, '2027-01-01', 1, 'active', 'RON')
ON DUPLICATE KEY UPDATE
                     target_amount_cents = VALUES(target_amount_cents),
                     target_hours        = VALUES(target_hours),
                     deadline_date       = VALUES(deadline_date),
                     priority            = VALUES(priority),
                     status              = VALUES(status),
                     currency            = VALUES(currency);
COMMIT;