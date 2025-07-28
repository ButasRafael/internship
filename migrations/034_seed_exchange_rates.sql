START TRANSACTION;
INSERT INTO exchange_rates
(day, base, quote, rate)
VALUES
    ('2025-08-01','EUR','RON',4.97),
    ('2025-08-01','USD','RON',4.55)
ON DUPLICATE KEY UPDATE
    rate = VALUES(rate);
COMMIT;
