import { Expense } from '../models/expense.model.js';

export const listExpenses = async (req, res) => {
    res.json(await Expense.findAllByUser(req.params.userId));
};

export const getExpense = async (req, res) => {
    const exp = await Expense.findById(req.params.id, req.params.userId);
    if (!exp) return res.status(404).json({ error: 'Expense not found' });
    res.json(exp);
};

export const createExpense = async (req, res, next) => {
    try {
        const expense = await Expense.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(expense);
    } catch (err) {
        next(err);
    }
};

export const updateExpense = async (req, res, next) => {
    try {
        const exp = await Expense.update(req.params.id, req.params.userId, req.body);
        if (!exp) return res.status(404).json({ error: 'Expense not found' });
        res.json(exp);
    } catch (err) {
        next(err);
    }
};

export const deleteExpense = async (req, res) => {
    await Expense.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
