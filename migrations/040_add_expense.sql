INSERT INTO expenses (user_id, category_id, name, amount_cents, currency, frequency, start_date, is_active)
VALUES (
           (SELECT id FROM users WHERE email='alice@example.com'),
           (SELECT id FROM categories WHERE user_id=(SELECT id FROM users WHERE email='alice@example.com') AND name='Housing'),
           'Test spike', 4000000, 'RON', 'once', CURDATE(), 1
       );
