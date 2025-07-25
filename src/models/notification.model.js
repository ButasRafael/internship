import { pool } from '../config/db.js';

export class Notification {
    static async create({ alert_id, sent_at = null, channel = 'email', payload_json }) {
        const [res] = await pool.execute(
            `INSERT INTO notifications (alert_id, sent_at, channel, payload_json)
             VALUES (?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?)`,
            [alert_id, sent_at, channel, JSON.stringify(payload_json)]
        );
        return this.findById(res.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.execute(`SELECT * FROM notifications WHERE id=?`, [id]);
        return rows[0] ?? null;
    }

    static async findByIdForUser(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT n.*
             FROM notifications n
                      JOIN alerts a ON a.id = n.alert_id
             WHERE n.id = ? AND a.user_id = ?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByAlert(alert_id, user_id) {
        const [rows] = await pool.execute(
            `SELECT n.*
             FROM notifications n
                      JOIN alerts a ON a.id = n.alert_id
             WHERE n.alert_id = ? AND a.user_id = ?
             ORDER BY n.sent_at DESC`,
            [alert_id, user_id]
        );
        return rows;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT n.*
         FROM notifications n
         JOIN alerts a ON a.id = n.alert_id
        WHERE a.user_id=?
        ORDER BY n.sent_at DESC`,
            [user_id]
        );
        return rows;
    }

    static async remove(id, user_id) {
        const row = await this.findByIdForUser(id, user_id);
        if (!row) return false;
        await pool.execute(`DELETE FROM notifications WHERE id=?`, [id]);
        return true;
    }
}
