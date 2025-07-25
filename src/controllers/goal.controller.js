import { Goal } from '../models/goal.model.js';

export const listGoals = async (req, res) => {
    res.json(await Goal.findAllByUser(req.params.userId));
};

export const getGoal = async (req, res) => {
    const g = await Goal.findById(req.params.id, req.params.userId);
    if (!g) return res.status(404).json({ error: 'Goal not found' });
    res.json(g);
};

export const createGoal = async (req, res, next) => {
    try {
        const g = await Goal.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(g);
    } catch (err) {
        next(err);
    }
};

export const updateGoal = async (req, res, next) => {
    try {
        const g = await Goal.update(req.params.id, req.params.userId, req.body);
        if (!g) return res.status(404).json({ error: 'Goal not found' });
        res.json(g);
    } catch (err) {
        next(err);
    }
};

export const deleteGoal = async (req, res) => {
    await Goal.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
