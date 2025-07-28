START TRANSACTION;
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id
FROM permissions
ON DUPLICATE KEY UPDATE
                     role_id       = VALUES(role_id),
                     permission_id = VALUES(permission_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id
FROM permissions
WHERE action NOT LIKE 'user_%'
  AND action NOT LIKE 'exchange_rate_%'
ON DUPLICATE KEY UPDATE
                     role_id       = VALUES(role_id),
                     permission_id = VALUES(permission_id);
COMMIT;
