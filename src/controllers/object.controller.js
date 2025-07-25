import { ObjectModel } from '../models/object.model.js';

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
        const obj = await ObjectModel.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(obj);
    } catch (err) {
        next(err);
    }
};

export const updateObject = async (req, res, next) => {
    try {
        const obj = await ObjectModel.update(req.params.id, req.params.userId, req.body);
        if (!obj) return res.status(404).json({ error: 'Object not found' });
        res.json(obj);
    } catch (err) {
        next(err);
    }
};

export const deleteObject = async (req, res) => {
    await ObjectModel.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
