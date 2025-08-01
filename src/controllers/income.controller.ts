import { Request, Response, NextFunction } from 'express'
import { Income } from '../models/income.model.js'

export const listIncomes = async (req: Request, res: Response): Promise<void> => {
    res.json(await Income.findAllByUser(Number(req.params.userId)))
}

export const getIncome = async (req: Request, res: Response): Promise<void> => {
    const inc = await Income.findById(Number(req.params.id), Number(req.params.userId))
    if (!inc) {
        res.status(404).json({ error: 'Income not found' })
        return
    }
    res.json(inc)
}

export const createIncome = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const inc = await Income.create({ user_id: Number(req.params.userId), ...req.body })
        res.status(201).json(inc)
    } catch (err) {
        next(err)
    }
}

export const updateIncome = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const inc = await Income.update(
            Number(req.params.id),
            Number(req.params.userId),
            req.body
        )
        if (!inc) {
            res.status(404).json({ error: 'Income not found' })
            return
        }
        res.json(inc)
    } catch (err) {
        next(err)
    }
}

export const deleteIncome = async (req: Request, res: Response): Promise<void> => {
    await Income.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}
