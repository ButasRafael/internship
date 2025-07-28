START TRANSACTION;
CREATE TABLE IF NOT EXISTS notifications (
                                             id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                             alert_id BIGINT UNSIGNED NOT NULL,
                                             sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                             channel ENUM('email','telegram','webhook') NOT NULL DEFAULT 'email',
                                             payload_json JSON NOT NULL,
                                             CONSTRAINT fk_notif_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
                                             INDEX idx_notif_alert (alert_id)
);
COMMIT;