import { Alert } from '../models/alert.model.js';

export const listAlerts = async (req, res) => {
    res.json(await Alert.findAllByUser(req.params.userId));
};

export const getAlert = async (req, res) => {
    const a = await Alert.findById(req.params.id, req.params.userId);
    if (!a) return res.status(404).json({ error: 'Alert not found' });
    res.json(a);
};

export const createAlert = async (req, res, next) => {
    try {
        const a = await Alert.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(a);
    } catch (err) {
        next(err);
    }
};

export const updateAlert = async (req, res, next) => {
    try {
        const a = await Alert.update(req.params.id, req.params.userId, req.body);
        if (!a) return res.status(404).json({ error: 'Alert not found' });
        res.json(a);
    } catch (err) {
        next(err);
    }
};

export const deleteAlert = async (req, res) => {
    await Alert.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
