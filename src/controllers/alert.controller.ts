import { Request, Response, NextFunction } from 'express'
import { Alert } from '../models/alert.model.js'

export const listAlerts = async (req: Request, res: Response) => {
    const rows = await Alert.findAllByUser(Number(req.params.userId))
    res.json(rows)
}

export const getAlert = async (req: Request, res: Response) => {
    const row = await Alert.findById(Number(req.params.id), Number(req.params.userId))
    if (!row) {
        res.status(404).json({ error: 'Alert not found' })
        return
    }
    res.json(row)
}

export const createAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const row = await Alert.create({ user_id: Number(req.params.userId), ...req.body })
        res.status(201).json(row)
    } catch (err) {
        next(err)
    }
}

export const updateAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const row = await Alert.update(
            Number(req.params.id),
            Number(req.params.userId),
            req.body,
        )
        if (!row) {
            res.status(404).json({ error: 'Alert not found' })
            return
        }
        res.json(row)
    } catch (err) {
        next(err)
    }
}

export const deleteAlert = async (req: Request, res: Response) => {
    await Alert.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}
