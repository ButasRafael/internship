import { Request, Response, NextFunction } from 'express'
import { BudgetAllocation } from '../models/budgetAllocation.model.js'

export const listAllocations = async (req: Request, res: Response): Promise<void> => {
    const rows = await BudgetAllocation.findAllByBudget(
        Number(req.params.budgetId),
        Number(req.params.userId)
    )
    res.json(rows)
}

export const getAllocation = async (req: Request, res: Response): Promise<void> => {
    const row = await BudgetAllocation.findById(
        Number(req.params.id),
        Number(req.params.budgetId),
        Number(req.params.userId)
    )
    if (!row) {
        res.status(404).json({ error: 'Allocation not found' })
        return
    }
    res.json(row)
}

export const createAllocation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await BudgetAllocation.create(Number(req.params.userId), {
            budget_id: Number(req.params.budgetId),
            ...req.body
        })
        if (!row) {
            res.status(404).json({ error: 'Budget not found' })
            return
        }
        res.status(201).json(row)
    } catch (err) {
        next(err)
    }
}

export const updateAllocation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await BudgetAllocation.update(
            Number(req.params.id),
            Number(req.params.budgetId),
            Number(req.params.userId),
            req.body
        )
        if (!row) {
            res.status(404).json({ error: 'Allocation not found' })
            return
        }
        res.json(row)
    } catch (err) {
        next(err)
    }
}

export const deleteAllocation = async (req: Request, res: Response): Promise<void> => {
    const ok = await BudgetAllocation.remove(
        Number(req.params.id),
        Number(req.params.budgetId),
        Number(req.params.userId)
    )
    if (!ok) {
        res.status(404).json({ error: 'Allocation not found' })
        return
    }
    res.status(204).send()
}
