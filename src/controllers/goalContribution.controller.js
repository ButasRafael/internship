import { GoalContribution } from '../models/goalContribution.model.js';

export const listGoalContributions = async (req, res) => {
    const rows = await GoalContribution.findAllByGoal(req.params.goalId, req.params.userId);
    res.json(rows);
};

export const getGoalContribution = async (req, res) => {
    const row = await GoalContribution.findByIdForUser(req.params.id, req.params.userId);
    if (!row || row.goal_id !== Number(req.params.goalId)) {
        return res.status(404).json({ error: 'Contribution not found' });
    }
    res.json(row);
};

export const createGoalContribution = async (req, res, next) => {
    try {
        const row = await GoalContribution.create(req.params.userId, {
            goal_id: req.params.goalId,
            ...req.body
        });
        if (!row) return res.status(404).json({ error: 'Goal not found or not yours' });
        res.status(201).json(row);
    } catch (err) {
        next(err);
    }
};

export const updateGoalContribution = async (req, res, next) => {
    try {
        const row = await GoalContribution.update(
            req.params.id,
            req.params.goalId,
            req.params.userId,
            req.body
        );
        if (!row) return res.status(404).json({ error: 'Contribution not found' });
        res.json(row);
    } catch (err) {
        next(err);
    }
};

export const deleteGoalContribution = async (req, res, next) => {
    try {
        const ok = await GoalContribution.remove(
            req.params.id,
            req.params.goalId,
            req.params.userId
        );
        if (!ok) return res.status(404).json({ error: 'Contribution not found' });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
