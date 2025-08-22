import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/notification.model.js';
import { Alert } from '../models/alert.model.js';

type UserParams = { userId: string };
type AlertParams = { userId: string; alertId: string };
type NotificationParams = { userId: string; id: string };

type ListQuery = {
    since_id?: string;
    since_ts?: string;
    limit?: string;
    order?: 'ASC' | 'DESC' | string;
    unread?: string;
};

type CreateBody = {
    sent_at?: string | null;
    channel?: 'email' | 'telegram' | 'webhook' | 'websocket';
    payload_json?: unknown;
};

// ---------- helpers ----------
function toBool(v: unknown): boolean {
    if (v == null) return false;
    const s = String(v).toLowerCase();
    return s === '1' || s === 'true' || s === 'yes';
}
function toOrder(v: unknown): 'ASC' | 'DESC' {
    return String(v).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

// ---------- controllers ----------
export const listNotificationsForAlert = async (
    req: Request<AlertParams>,
    res: Response
): Promise<void> => {
    res.json(
        await Notification.findAllByAlert(
            Number(req.params.alertId),
            Number(req.params.userId)
        )
    );
};

export const listNotificationsByUser = async (
    req: Request<UserParams, unknown, unknown, ListQuery>,
    res: Response
): Promise<void> => {
    const userId = Number(req.params.userId);
    const { since_id, since_ts, limit, order, unread } = req.query;

    const rows = await Notification.findAllByUser(userId, {
        since_id: since_id != null ? Number(since_id) : undefined,
        since_ts: since_ts != null ? String(since_ts) : undefined,
        limit:    limit    != null ? Number(limit)    : undefined,
        order:    order    != null ? toOrder(order)   : undefined,
        unread_only: toBool(unread),
    });

    res.json(rows);
};

export const getNotification = async (
    req: Request<NotificationParams>,
    res: Response
): Promise<void> => {
    const n = await Notification.findByIdForUser(
        Number(req.params.id),
        Number(req.params.userId)
    );
    if (!n) {
        res.status(404).json({ error: 'Notification not found' });
        return;
    }
    res.json(n);
};

export const createNotification = async (
    req: Request<AlertParams, unknown, CreateBody>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const alert = await Alert.findById(
            Number(req.params.alertId),
            Number(req.params.userId)
        );
        if (!alert) {
            res.status(404).json({ error: 'Alert not found' });
            return;
        }

        const { sent_at = null, channel, payload_json } = req.body || {};
        if (payload_json == null) {
            res.status(400).json({ error: 'payload_json is required' });
            return;
        }

        const n = await Notification.create({
            alert_id: Number(req.params.alertId),
            sent_at,
            channel,
            payload_json,
        });

        res.status(201).json(n);
    } catch (err) {
        next(err);
    }
};

export const deleteNotification = async (
    req: Request<NotificationParams>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ok = await Notification.remove(
            Number(req.params.id),
            Number(req.params.userId)
        );
        if (!ok) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

export const markNotificationRead = async (
    req: Request<NotificationParams>,
    res: Response
): Promise<void> => {
    const ok = await Notification.markRead(
        Number(req.params.id),
        Number(req.params.userId)
    );
    if (!ok) {
        res.status(404).json({ error: 'Notification not found' });
        return;
    }
    res.status(204).send();
};

export const markAllNotificationsRead = async (
    req: Request<UserParams>,
    res: Response
): Promise<void> => {
    const updated = await Notification.markAllRead(Number(req.params.userId));
    res.json({ updated });
};

export const getUnreadCount = async (
    req: Request<UserParams>,
    res: Response
): Promise<void> => {
    const unread = await Notification.countUnreadByUser(Number(req.params.userId));
    res.json({ count: unread });
};
