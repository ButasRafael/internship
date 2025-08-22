import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface NotificationRow extends RowDataPacket {
    id: number
    alert_id: number
    sent_at: string
    read_at: string | null
    channel: 'email' | 'telegram' | 'webhook' | 'websocket'
    payload_json: unknown
    dedupe_key?: string | null
}

interface CountRow extends RowDataPacket {
    cnt: number
}

interface CreateArgs {
    alert_id: number
    sent_at?: string | null
    channel?: NotificationRow['channel']
    payload_json: unknown
}

export class Notification {
    static async create({
                            alert_id,
                            sent_at = null,
                            channel = 'email',
                            payload_json,
                        }: CreateArgs): Promise<NotificationRow | null> {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO notifications (alert_id, sent_at, read_at, channel, payload_json)
             VALUES (?, COALESCE(?, CURRENT_TIMESTAMP), NULL, ?, ?)`,
            [alert_id, sent_at, channel, JSON.stringify(payload_json)],
        )
        return this.findById(res.insertId)
    }

    static async findById(id: number): Promise<NotificationRow | null> {
        const [rows] = await pool.execute<NotificationRow[]>(
            `SELECT * FROM notifications WHERE id=?`,
            [id],
        )
        return rows[0] ?? null
    }

    static async findByIdForUser(
        id: number,
        user_id: number,
    ): Promise<NotificationRow | null> {
        const [rows] = await pool.execute<NotificationRow[]>(
            `SELECT n.*
             FROM notifications n
                      JOIN alerts a ON a.id = n.alert_id
             WHERE n.id = ? AND a.user_id = ?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByAlert(
        alert_id: number,
        user_id: number,
    ): Promise<NotificationRow[]> {
        const [rows] = await pool.execute<NotificationRow[]>(
            `SELECT n.*
             FROM notifications n
                      JOIN alerts a ON a.id = n.alert_id
             WHERE n.alert_id = ? AND a.user_id = ?
             ORDER BY n.sent_at DESC`,
            [alert_id, user_id],
        )
        return rows
    }

    static async findAllByUser(
        user_id: number,
        opts?: {
            since_id?: number;
            since_ts?: string;
            limit?: number;
            order?: 'ASC' | 'DESC';
            unread_only?: boolean;
        }
    ): Promise<NotificationRow[]> {
        const where: string[] = ['a.user_id=?'];
        const params: any[] = [user_id];

        if (opts?.since_id != null) { where.push('n.id > ?'); params.push(Number(opts.since_id)); }
        if (opts?.since_ts)        { where.push('n.sent_at > ?'); params.push(String(opts.since_ts)); }
        if (opts?.unread_only)     { where.push('n.read_at IS NULL'); }

        // validate & clamp limit, then inline it (no placeholder in LIMIT)
        let limit = 100;
        if (opts?.limit != null) {
            const n = Math.floor(Number(opts.limit));
            limit = Number.isFinite(n) ? Math.max(1, Math.min(n, 200)) : 100;
        }

        const order: 'ASC' | 'DESC' = opts?.order === 'ASC' ? 'ASC' : 'DESC';

        const sql = `
    SELECT n.*
    FROM notifications n
    JOIN alerts a ON a.id = n.alert_id
    WHERE ${where.join(' AND ')}
    ORDER BY n.id ${order}
    LIMIT ${limit}
  `;

        const [rows] = await pool.execute<NotificationRow[]>(sql, params);
        return rows;
    }


    static async markRead(id: number, user_id: number): Promise<boolean> {
        const [res] = await pool.execute<ResultSetHeader>(
            `UPDATE notifications n
                JOIN alerts a ON a.id = n.alert_id
             SET n.read_at = COALESCE(n.read_at, CURRENT_TIMESTAMP)
             WHERE n.id=? AND a.user_id=?`,
            [id, user_id],
        )
        return res.affectedRows > 0
    }

    // Mark all unread notifications as read
    static async markAllRead(user_id: number): Promise<number> {
        const [res] = await pool.execute<ResultSetHeader>(
            `UPDATE notifications n
                JOIN alerts a ON a.id = n.alert_id
             SET n.read_at = CURRENT_TIMESTAMP
             WHERE a.user_id=? AND n.read_at IS NULL`,
            [user_id],
        )
        return res.affectedRows
    }

    static async countUnreadByUser(user_id: number): Promise<number> {
        const [rows] = await pool.execute<CountRow[]>(
            `SELECT COUNT(*) AS cnt
             FROM notifications n
                      JOIN alerts a ON a.id = n.alert_id
             WHERE a.user_id=? AND n.read_at IS NULL`,
            [user_id],
        )
        return Number(rows[0]?.cnt || 0)
    }

    static async remove(id: number, user_id: number): Promise<boolean> {
        const row = await this.findByIdForUser(id, user_id)
        if (!row) return false
        await pool.execute(`DELETE FROM notifications WHERE id=?`, [id])
        return true
    }
}
