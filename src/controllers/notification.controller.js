import { Notification } from '../models/notification.model.js';
import { Alert } from '../models/alert.model.js';

export const listNotificationsForAlert = async (req, res) => {
    res.json(await Notification.findAllByAlert(req.params.alertId, req.params.userId));
};

export const listNotificationsByUser = async (req, res) => {
    res.json(await Notification.findAllByUser(req.params.userId));
};

export const getNotification = async (req, res) => {
    const n = await Notification.findByIdForUser(req.params.id, req.params.userId);
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json(n);
};

export const createNotification = async (req, res, next) => {
    try {
        const alert = await Alert.findById(req.params.alertId, req.params.userId);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        const n = await Notification.create({
            alert_id: req.params.alertId,
            ...req.body
        });
        res.status(201).json(n);
    } catch (err) {
        next(err);
    }
};

export const deleteNotification = async (req, res, next) => {
    try {
        const ok = await Notification.remove(req.params.id, req.params.userId);
        if (!ok) return res.status(404).json({ error: 'Notification not found' });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
