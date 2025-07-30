import { ObjectModel } from '../models/object.model.js';
import fs from 'node:fs/promises';
import path from "node:path";

export const listObjects = async (req, res) => {
    res.json(await ObjectModel.findAllByUser(req.params.userId));
};

export const getObject = async (req, res) => {
    const obj = await ObjectModel.findById(req.params.id, req.params.userId);
    if (!obj) return res.status(404).json({ error: 'Object not found' });
    res.json(obj);
};

export const createObject = async (req, res, next) => {
    try {
        const file = Array.isArray(req.files) ? req.files[0] : undefined;
        const imagePath = file ? `objects/${file.filename}` : null;
        const obj = await ObjectModel.create({ user_id: req.params.userId, ...req.body, image_path: imagePath });
        res.status(201).json(obj);
    } catch (err) {
        next(err);
    }
};

export const updateObject = async (req, res, next) => {
    try {
        const existing = await ObjectModel.findById(req.params.id, req.params.userId);
        if (!existing) return res.status(404).json({ error: 'Object not found' });

        let imagePath = existing.image_path;

        const file = Array.isArray(req.files) ? req.files[0] : undefined;
        if (file) {
            if (imagePath) {
                await fs.rm(path.resolve('uploads', imagePath), { force: true });
            }
            imagePath = `objects/${file.filename}`;
        }

        if ('image_path' in req.body && req.body.image_path === null && imagePath) {
            await fs.rm(path.resolve('uploads', imagePath), { force: true });
            imagePath = null;
        }

        const obj = await ObjectModel.update(
            req.params.id,
            req.params.userId,
            { ...req.body, image_path: imagePath }
        );

        res.json(obj);
    } catch (err) { next(err); }
};

export const deleteObject = async (req, res, next) => {
    try {
        const obj = await ObjectModel.findById(req.params.id, req.params.userId);
        if (obj?.image_path) {
            await fs.rm(path.resolve('uploads', obj.image_path), { force: true });
        }
        await ObjectModel.remove(req.params.id, req.params.userId);
        res.status(204).send();
    } catch (err) { next(err); }
};
