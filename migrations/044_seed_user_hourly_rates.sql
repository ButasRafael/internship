START TRANSACTION;

-- Seed month‑effective hourly rates for demo users
INSERT INTO user_hourly_rates (user_id, effective_month, hourly_rate)
VALUES
  -- Alice: gradual increase
  ((SELECT id FROM users WHERE email='alice@example.com'), '2024-12-01',  90.00),
  ((SELECT id FROM users WHERE email='alice@example.com'), '2025-01-01', 100.00),
  ((SELECT id FROM users WHERE email='alice@example.com'), '2025-06-01', 110.00),

  -- Bob: adjustment in spring
  ((SELECT id FROM users WHERE email='bob@example.com'),   '2025-01-01',  75.00),
  ((SELECT id FROM users WHERE email='bob@example.com'),   '2025-03-01',  80.00),

  -- Carol: stable
  ((SELECT id FROM users WHERE email='carol@example.com'), '2025-01-01', 120.00)
ON DUPLICATE KEY UPDATE
  hourly_rate = VALUES(hourly_rate),
  updated_at  = CURRENT_TIMESTAMP;

COMMIT;

