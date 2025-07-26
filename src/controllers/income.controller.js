import { Income } from '../models/income.model.js';

export const listIncomes = async (req, res) => {
    res.json(await Income.findAllByUser(req.params.userId));
};

export const getIncome = async (req, res) => {
    const inc = await Income.findById(req.params.id, req.params.userId);
    if (!inc) return res.status(404).json({ error: 'Income not found' });
    res.json(inc);
};

export const createIncome = async (req, res, next) => {
    try {
        const inc = await Income.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(inc);
    } catch (err) {
        next(err);
    }
};

export const updateIncome = async (req, res, next) => {
    try {
        const inc = await Income.update(req.params.id, req.params.userId, req.body);
        if (!inc) return res.status(404).json({ error: 'Income not found' });
        res.json(inc);
    } catch (err) {
        next(err);
    }
};

export const deleteIncome = async (req, res) => {
    await Income.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
