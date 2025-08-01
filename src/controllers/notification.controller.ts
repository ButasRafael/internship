import { Request, Response, NextFunction } from 'express'
import { Notification } from '../models/notification.model.js'
import { Alert } from '../models/alert.model.js'

export const listNotificationsForAlert = async (
    req: Request,
    res: Response
): Promise<void> => {
    res.json(
        await Notification.findAllByAlert(
            Number(req.params.alertId),
            Number(req.params.userId)
        )
    )
}

export const listNotificationsByUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    res.json(await Notification.findAllByUser(Number(req.params.userId)))
}

export const getNotification = async (
    req: Request,
    res: Response
): Promise<void> => {
    const n = await Notification.findByIdForUser(
        Number(req.params.id),
        Number(req.params.userId)
    )
    if (!n) {
        res.status(404).json({ error: 'Notification not found' })
        return
    }
    res.json(n)
}

export const createNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const alert = await Alert.findById(
            Number(req.params.alertId),
            Number(req.params.userId)
        )
        if (!alert) {
            res.status(404).json({ error: 'Alert not found' })
            return
        }
        const n = await Notification.create({
            alert_id: Number(req.params.alertId),
            ...req.body
        })
        res.status(201).json(n)
    } catch (err) {
        next(err)
    }
}

export const deleteNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ok = await Notification.remove(
            Number(req.params.id),
            Number(req.params.userId)
        )
        if (!ok) {
            res.status(404).json({ error: 'Notification not found' })
            return
        }
        res.status(204).send()
    } catch (err) {
        next(err)
    }
}
