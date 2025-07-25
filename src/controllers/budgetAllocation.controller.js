import { BudgetAllocation } from '../models/budgetAllocation.model.js';

export const listAllocations = async (req, res) => {
    res.json(await BudgetAllocation.findAllByBudget(req.params.budgetId, req.params.userId));
};

export const getAllocation = async (req, res) => {
    const row = await BudgetAllocation.findById(req.params.id, req.params.budgetId, req.params.userId);
    if (!row) return res.status(404).json({ error: 'Allocation not found' });
    res.json(row);
};

export const createAllocation = async (req, res, next) => {
    try {
        const row = await BudgetAllocation.create(req.params.userId, {
            budget_id: req.params.budgetId,
            ...req.body
        });
        if (!row) return res.status(404).json({ error: 'Budget not found' });
        res.status(201).json(row);
    } catch (err) {
        next(err);
    }
};

export const updateAllocation = async (req, res, next) => {
    try {
        const row = await BudgetAllocation.update(
            req.params.id,
            req.params.budgetId,
            req.params.userId,
            req.body
        );
        if (!row) return res.status(404).json({ error: 'Allocation not found' });
        res.json(row);
    } catch (err) {
        next(err);
    }
};

export const deleteAllocation = async (req, res) => {
    const ok = await BudgetAllocation.remove(
        req.params.id,
        req.params.budgetId,
        req.params.userId
    );
    if (!ok) return res.status(404).json({ error: 'Allocation not found' });
    res.status(204).send();
};
