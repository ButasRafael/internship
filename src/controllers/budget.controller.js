import { Budget } from '../models/budget.model.js';

export const listBudgets = async (req, res) => {
    res.json(await Budget.findAllByUser(req.params.userId));
};

export const getBudget = async (req, res) => {
    const b = await Budget.findById(req.params.id, req.params.userId);
    if (!b) return res.status(404).json({ error: 'Budget not found' });
    res.json(b);
};

export const createBudget = async (req, res, next) => {
    try {
        const b = await Budget.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(b);
    } catch (err) {
        next(err);
    }
};

export const updateBudget = async (req, res, next) => {
    try {
        const b = await Budget.update(req.params.id, req.params.userId, req.body);
        if (!b) return res.status(404).json({ error: 'Budget not found' });
        res.json(b);
    } catch (err) {
        next(err);
    }
};

export const deleteBudget = async (req, res) => {
    await Budget.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
