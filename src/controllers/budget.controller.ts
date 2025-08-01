import { Request, Response, NextFunction } from 'express'
import { Budget } from '../models/budget.model.js'

export const listBudgets = async (req: Request, res: Response): Promise<void> => {
    const rows = await Budget.findAllByUser(Number(req.params.userId))
    res.json(rows)
}

export const getBudget = async (req: Request, res: Response): Promise<void> => {
    const row = await Budget.findById(Number(req.params.id), Number(req.params.userId))
    if (!row) {
        res.status(404).json({ error: 'Budget not found' })
        return
    }
    res.json(row)
}

export const createBudget = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await Budget.create({ user_id: Number(req.params.userId), ...req.body })
        res.status(201).json(row)
    } catch (err) {
        next(err)
    }
}

export const updateBudget = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await Budget.update(Number(req.params.id), Number(req.params.userId), req.body)
        if (!row) {
            res.status(404).json({ error: 'Budget not found' })
            return
        }
        res.json(row)
    } catch (err) {
        next(err)
    }
}

export const deleteBudget = async (req: Request, res: Response): Promise<void> => {
    await Budget.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}
