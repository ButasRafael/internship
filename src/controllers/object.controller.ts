import { Request, Response, NextFunction } from 'express'
import { ObjectModel } from '../models/object.model.js'
import fs from 'node:fs/promises'
import path from 'node:path'

export const listObjects = async (
    req: Request,
    res: Response
): Promise<void> => {
    res.json(await ObjectModel.findAllByUser(Number(req.params.userId)))
}

export const getObject = async (
    req: Request,
    res: Response
): Promise<void> => {
    const obj = await ObjectModel.findById(
        Number(req.params.id),
        Number(req.params.userId)
    )
    if (!obj) {
        res.status(404).json({ error: 'Object not found' })
        return
    }
    res.json(obj)
}

export const createObject = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const file =
            Array.isArray(req.files) && req.files.length
                ? (req.files[0] as Express.Multer.File)
                : undefined
        const imagePath = file ? `objects/${file.filename}` : null
        const obj = await ObjectModel.create({
            user_id: Number(req.params.userId),
            ...req.body,
            image_path: imagePath
        })
        res.status(201).json(obj)
    } catch (err) {
        next(err)
    }
}

export const updateObject = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const existing = await ObjectModel.findById(
            Number(req.params.id),
            Number(req.params.userId)
        )
        if (!existing) {
            res.status(404).json({ error: 'Object not found' })
            return
        }

        let imagePath: string | null = existing.image_path

        const file =
            Array.isArray(req.files) && req.files.length
                ? (req.files[0] as Express.Multer.File)
                : undefined

        if (file) {
            if (imagePath) {
                await fs.rm(path.resolve('uploads', imagePath), { force: true })
            }
            imagePath = `objects/${file.filename}`
        }

        if ('image_path' in req.body && req.body.image_path === null && imagePath) {
            await fs.rm(path.resolve('uploads', imagePath), { force: true })
            imagePath = null
        }

        const obj = await ObjectModel.update(Number(req.params.id), Number(req.params.userId), {
            ...req.body,
            image_path: imagePath
        })

        res.json(obj)
    } catch (err) {
        next(err)
    }
}

export const deleteObject = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const obj = await ObjectModel.findById(
            Number(req.params.id),
            Number(req.params.userId)
        )
        if (obj?.image_path) {
            await fs.rm(path.resolve('uploads', obj.image_path), { force: true })
        }
        await ObjectModel.remove(Number(req.params.id), Number(req.params.userId))
        res.status(204).send()
    } catch (err) {
        next(err)
    }
}
