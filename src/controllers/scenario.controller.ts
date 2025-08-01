import { Request, Response, NextFunction } from 'express'
import { Scenario } from '../models/scenario.model.js'

export const listScenarios = async (
    req: Request,
    res: Response
): Promise<void> => {
    res.json(await Scenario.findAllByUser(Number(req.params.userId)))
}

export const getScenario = async (
    req: Request,
    res: Response
): Promise<void> => {
    const sc = await Scenario.findById(
        Number(req.params.id),
        Number(req.params.userId)
    )
    if (!sc) {
        res.status(404).json({ error: 'Scenario not found' })
        return
    }
    res.json(sc)
}

export const createScenario = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const sc = await Scenario.create({
            user_id: Number(req.params.userId),
            ...req.body
        })
        res.status(201).json(sc)
    } catch (err) {
        next(err)
    }
}

export const updateScenario = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const sc = await Scenario.update(
            Number(req.params.id),
            Number(req.params.userId),
            req.body
        )
        if (!sc) {
            res.status(404).json({ error: 'Scenario not found' })
            return
        }
        res.json(sc)
    } catch (err) {
        next(err)
    }
}

export const deleteScenario = async (
    req: Request,
    res: Response
): Promise<void> => {
    await Scenario.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}
