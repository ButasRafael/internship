import { Request, Response, NextFunction } from 'express'
import { Expense } from '../models/expense.model.js'

export const listExpenses = async (req: Request, res: Response): Promise<void> => {
    const rows = await Expense.findAllByUser(Number(req.params.userId))
    res.json(rows)
}

export const getExpense = async (req: Request, res: Response): Promise<void> => {
    const row = await Expense.findById(Number(req.params.id), Number(req.params.userId))
    if (!row) {
        res.status(404).json({ error: 'Expense not found' })
        return
    }
    res.json(row)
}

export const createExpense = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await Expense.create({ user_id: Number(req.params.userId), ...req.body })
        res.status(201).json(row)
    } catch (err) {
        next(err)
    }
}

export const updateExpense = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await Expense.update(
            Number(req.params.id),
            Number(req.params.userId),
            req.body
        )
        if (!row) {
            res.status(404).json({ error: 'Expense not found' })
            return
        }
        res.json(row)
    } catch (err) {
        next(err)
    }
}

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
    await Expense.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}
