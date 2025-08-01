import { Request, Response, NextFunction } from 'express'
import { User } from '../models/user.model.js'

export const listUsers = async (_req: Request, res: Response): Promise<void> => {
    res.json(await User.findAll())
}

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(Number(req.params.id))
    if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
    }
    res.json(user)
}

export const createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { role_id = 2, ...safe } = req.body
        const user = await User.create({ ...safe, role_id })
        res.status(201).json(user)
    } catch (err) {
        next(err)
    }
}

export const updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await User.update(Number(req.params.id), req.body)
        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }
        res.json(user)
    } catch (err) {
        next(err)
    }
}

export const deleteUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    await User.remove(Number(req.params.id))
    res.status(204).send()
}
