START TRANSACTION;
INSERT INTO incomes (user_id, received_at, amount_cents, currency, source, recurring, notes)
VALUES

((SELECT id FROM users WHERE email='alice@example.com'), '2025-08-01', 2000000, 'RON', 'salary',    'monthly', 'Salary August'),
((SELECT id FROM users WHERE email='alice@example.com'), '2025-08-15',  200000, 'RON', 'freelance', 'none',    'Side gig'),
((SELECT id FROM users WHERE email='alice@example.com'), '2025-04-15',  250000, 'RON', 'freelance', 'none',    'Project April'),
((SELECT id FROM users WHERE email='alice@example.com'), '2025-05-20',   50000, 'RON', 'gift',      'none',    'Birthday gift'),
((SELECT id FROM users WHERE email='alice@example.com'), '2025-06-10',  300000, 'RON', 'freelance', 'none',    'Short contract'),

((SELECT id FROM users WHERE email='bob@example.com'),   '2025-09-01', 1500000, 'RON', 'salary',    'monthly', 'Salary September'),
((SELECT id FROM users WHERE email='bob@example.com'),   '2025-05-15',  100000, 'RON', 'bonus',     'none',    'H1 bonus'),
((SELECT id FROM users WHERE email='bob@example.com'),   '2025-07-02',  150000, 'RON', 'freelance', 'none',    'Weekend work'),

((SELECT id FROM users WHERE email='carol@example.com'), '2025-10-01', 2500000, 'RON', 'salary',    'monthly', 'Salary October'),
((SELECT id FROM users WHERE email='carol@example.com'), '2025-10-10',  500000, 'RON', 'bonus',     'none',    'Performance bonus'),
((SELECT id FROM users WHERE email='carol@example.com'), '2025-05-25',   80000, 'RON', 'dividend', 'none',    'ETF distribution'),
((SELECT id FROM users WHERE email='carol@example.com'), '2025-06-20',  200000, 'RON', 'bonus',     'none',    'Mid-year bonus')
ON DUPLICATE KEY UPDATE
                     amount_cents = VALUES(amount_cents),
                     recurring    = VALUES(recurring),
                     notes        = VALUES(notes);
COMMIT;
