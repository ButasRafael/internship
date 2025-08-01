import { Request, Response, NextFunction } from 'express'
import { Activity } from '../models/activity.model.js'

export const listActivities = async (req: Request, res: Response) => {
    const rows = await Activity.findAllByUser(Number(req.params.userId))
    res.json(rows)
}

export const getActivity = async (req: Request, res: Response) => {
    const row = await Activity.findById(Number(req.params.id), Number(req.params.userId))
    if (!row) {
        res.status(404).json({ error: 'Activity not found' })
        return
    }
    res.json(row)
}

export const createActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const row = await Activity.create({ user_id: Number(req.params.userId), ...req.body })
        res.status(201).json(row)
    } catch (err) {
        next(err)
    }
}

export const updateActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const row = await Activity.update(
            Number(req.params.id),
            Number(req.params.userId),
            req.body,
        )
        if (!row) {
            res.status(404).json({ error: 'Activity not found' })
            return
        }
        res.json(row)
    } catch (err) {
        next(err)
    }
}

export const deleteActivity = async (req: Request, res: Response) => {
    await Activity.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}
