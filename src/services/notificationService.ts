// src/services/notificationService.ts
import { Notification } from '../models/notification.model.js';
import { notifyUser } from '../ws/ws.js';
import { pool } from '../config/db.js';
import type { RowDataPacket } from 'mysql2/promise';

export type WebNotif = {
    title: string;
    message: string;
    severity?: 'info'|'success'|'warning'|'error';
    meta?: Record<string, unknown>;
    dedupe_key?: string;
};

interface CountRow extends RowDataPacket { cnt: number }

export async function sendWebNotification(userId: number, alertId: number, payload: WebNotif) {
    if (payload.dedupe_key) {
        const [rows] = await pool.execute<CountRow[]>(
            `SELECT COUNT(*) AS cnt
             FROM notifications
             WHERE alert_id=? AND channel='websocket'
               AND dedupe_key = ?
               AND sent_at >= (NOW() - INTERVAL 1 DAY)`,
            [alertId, payload.dedupe_key]
        );
        if ((rows[0]?.cnt ?? 0) > 0) return;
    }

    const n = await Notification.create({
        alert_id: alertId,
        channel: 'websocket',
        payload_json: payload,
    });

    notifyUser(userId, 'notification:new', {
        id: n?.id,
        alert_id: alertId,
        sent_at: n?.sent_at,
        ...payload,
    });
}
