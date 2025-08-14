START TRANSACTION;
INSERT INTO goal_contributions (goal_id, contributed_at, amount_cents, hours, source_type)
VALUES

((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com') AND name='Fond de urgență'),
 '2025-03-05',  80000, NULL, 'income'),
((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com') AND name='Fond de urgență'),
 '2025-05-10', 120000, NULL, 'income'),
((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com') AND name='Fond de urgență'),
 '2025-07-02', 150000, NULL, 'manual'),
((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com') AND name='Fond de urgență'),
 '2025-08-05', 100000, NULL, 'income'),

((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com') AND name='Vacanță Mare'),
 '2025-05-15',  30000, NULL, 'income'),
((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com') AND name='Vacanță Mare'),
 '2025-07-05',  40000, NULL, 'income'),
((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='bob@example.com') AND name='Vacanță Mare'),
 '2025-09-01',  20000, NULL, 'income'),

((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com') AND name='Avans apartament'),
 '2025-04-12', 120000, NULL, 'manual'),
((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com') AND name='Avans apartament'),
 '2025-06-18', 220000, NULL, 'income'),
((SELECT id FROM goals WHERE user_id=(SELECT id FROM users WHERE email='carol@example.com') AND name='Avans apartament'),
 '2025-10-05', 500000, NULL, 'manual')
ON DUPLICATE KEY UPDATE
                     amount_cents = VALUES(amount_cents),
                     hours        = VALUES(hours),
                     source_type  = VALUES(source_type);
COMMIT;