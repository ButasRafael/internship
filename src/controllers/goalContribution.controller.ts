import { Request, Response, NextFunction } from 'express'
import { GoalContribution } from '../models/goalContribution.model.js'

export const listGoalContributions = async (
    req: Request,
    res: Response
): Promise<void> => {
    const rows = await GoalContribution.findAllByGoal(
        Number(req.params.goalId),
        Number(req.params.userId)
    )
    res.json(rows)
}

export const getGoalContribution = async (
    req: Request,
    res: Response
): Promise<void> => {
    const row = await GoalContribution.findByIdForUser(
        Number(req.params.id),
        Number(req.params.userId)
    )
    if (!row || row.goal_id !== Number(req.params.goalId)) {
        res.status(404).json({ error: 'Contribution not found' })
        return
    }
    res.json(row)
}

export const createGoalContribution = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await GoalContribution.create(Number(req.params.userId), {
            goal_id: Number(req.params.goalId),
            ...req.body
        })
        if (!row) {
            res.status(404).json({ error: 'Goal not found or not yours' })
            return
        }
        res.status(201).json(row)
    } catch (err) {
        next(err)
    }
}

export const updateGoalContribution = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await GoalContribution.update(
            Number(req.params.id),
            Number(req.params.goalId),
            Number(req.params.userId),
            req.body
        )
        if (!row) {
            res.status(404).json({ error: 'Contribution not found' })
            return
        }
        res.json(row)
    } catch (err) {
        next(err)
    }
}

export const deleteGoalContribution = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ok = await GoalContribution.remove(
            Number(req.params.id),
            Number(req.params.goalId),
            Number(req.params.userId)
        )
        if (!ok) {
            res.status(404).json({ error: 'Contribution not found' })
            return
        }
        res.status(204).send()
    } catch (err) {
        next(err)
    }
}
