START TRANSACTION;
INSERT INTO users
(email, password_hash, role_id, token_version, hourly_rate, currency, timezone)
VALUES
    ('alice@example.com',
     '$2b$12$dqL0EDtLR.j.VrloMs2N7uDnu0Z9uMKztp6NYzTaWOkZnoPLsd6Vu',
     1, 0, 100.00, 'RON', 'Europe/Bucharest'),
    ('bob@example.com',
     '$2b$12$Q.4sTPfCww1/MjvMz62hduIDapErTqRrOTHgHV.Rhn95VsZLLO8la',
     2, 0,  80.00, 'RON', 'Europe/Bucharest'),
    ('carol@example.com',
     '$2b$12$Uk/ekgN9Z5K72PHzfr3zfuuXe1zt2X3t2XVAC7U2VT3ecP/XtOJHW',
     2, 0, 120.00, 'RON', 'Europe/Bucharest')
ON DUPLICATE KEY UPDATE
                     password_hash = VALUES(password_hash),
                     role_id       = VALUES(role_id),
                     token_version = VALUES(token_version),
                     hourly_rate   = VALUES(hourly_rate),
                     currency      = VALUES(currency),
                     timezone      = VALUES(timezone);
COMMIT;
