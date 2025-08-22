START TRANSACTION;
ALTER TABLE notifications
    ADD COLUMN read_at DATETIME NULL DEFAULT NULL AFTER sent_at,
    ADD INDEX idx_notif_alert_read (alert_id, read_at);
COMMIT;