START TRANSACTION;
INSERT INTO roles (id, name)
VALUES
    (1, 'admin'),
    (2, 'user')
ON DUPLICATE KEY UPDATE
    name = VALUES(name);
COMMIT;
