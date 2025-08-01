import { Request, Response, NextFunction } from 'express'
import { Category } from '../models/category.model.js'

export const listCategories = async (req: Request, res: Response): Promise<void> => {
    const rows = await Category.findAllByUser(Number(req.params.userId))
    res.json(rows)
}

export const getCategory = async (req: Request, res: Response): Promise<void> => {
    const row = await Category.findById(Number(req.params.id), Number(req.params.userId))
    if (!row) {
        res.status(404).json({ error: 'Category not found' })
        return
    }
    res.json(row)
}

export const createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await Category.create({ user_id: Number(req.params.userId), ...req.body })
        res.status(201).json(row)
    } catch (err) {
        next(err)
    }
}

export const updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const row = await Category.update(Number(req.params.id), Number(req.params.userId), req.body)
        if (!row) {
            res.status(404).json({ error: 'Category not found' })
            return
        }
        res.json(row)
    } catch (err) {
        next(err)
    }
}

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    await Category.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}
