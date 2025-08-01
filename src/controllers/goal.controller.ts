import { Request, Response, NextFunction } from 'express'
import { Goal } from '../models/goal.model.js'

export const listGoals = async (req: Request, res: Response): Promise<void> => {
    const rows = await Goal.findAllByUser(Number(req.params.userId))
    res.json(rows)
}

export const getGoal = async (req: Request, res: Response): Promise<void> => {
    const row = await Goal.findById(Number(req.params.id), Number(req.params.userId))
    if (!row) {
        res.status(404).json({ error: 'Goal not found' })
        return
    }
    res.json(row)
}

export const createGoal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await Goal.create({ user_id: Number(req.params.userId), ...req.body })
        res.status(201).json(row)
    } catch (err) {
        next(err)
    }
}

export const updateGoal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await Goal.update(
            Number(req.params.id),
            Number(req.params.userId),
            req.body
        )
        if (!row) {
            res.status(404).json({ error: 'Goal not found' })
            return
        }
        res.json(row)
    } catch (err) {
        next(err)
    }
}

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
    await Goal.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}
