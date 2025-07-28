START TRANSACTION;
INSERT INTO categories (user_id, name, kind)
VALUES
    ((SELECT id FROM users WHERE email='alice@example.com'),'Housing','expense'),
    ((SELECT id FROM users WHERE email='alice@example.com'),'Subscriptions','expense'),
    ((SELECT id FROM users WHERE email='alice@example.com'),'Objects','object'),
    ((SELECT id FROM users WHERE email='alice@example.com'),'Activities','activity'),
    ((SELECT id FROM users WHERE email='alice@example.com'),'Food','expense'),
    ((SELECT id FROM users WHERE email='bob@example.com'),'Housing','expense'),
    ((SELECT id FROM users WHERE email='bob@example.com'),'Subscriptions','expense'),
    ((SELECT id FROM users WHERE email='bob@example.com'),'Objects','object'),
    ((SELECT id FROM users WHERE email='bob@example.com'),'Activities','activity'),
    ((SELECT id FROM users WHERE email='bob@example.com'),'Food','expense'),
    ((SELECT id FROM users WHERE email='carol@example.com'),'Housing','expense'),
    ((SELECT id FROM users WHERE email='carol@example.com'),'Subscriptions','expense'),
    ((SELECT id FROM users WHERE email='carol@example.com'),'Objects','object'),
    ((SELECT id FROM users WHERE email='carol@example.com'),'Activities','activity'),
    ((SELECT id FROM users WHERE email='carol@example.com'),'Food','expense')
ON DUPLICATE KEY UPDATE
    kind = VALUES(kind);
COMMIT;
