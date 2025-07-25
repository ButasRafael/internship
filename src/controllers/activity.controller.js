import { Activity } from '../models/activity.model.js';

export const listActivities = async (req, res) => {
    res.json(await Activity.findAllByUser(req.params.userId));
};

export const getActivity = async (req, res) => {
    const act = await Activity.findById(req.params.id, req.params.userId);
    if (!act) return res.status(404).json({ error: 'Activity not found' });
    res.json(act);
};

export const createActivity = async (req, res, next) => {
    try {
        const act = await Activity.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(act);
    } catch (err) {
        next(err);
    }
};

export const updateActivity = async (req, res, next) => {
    try {
        const act = await Activity.update(req.params.id, req.params.userId, req.body);
        if (!act) return res.status(404).json({ error: 'Activity not found' });
        res.json(act);
    } catch (err) {
        next(err);
    }
};

export const deleteActivity = async (req, res) => {
    await Activity.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
