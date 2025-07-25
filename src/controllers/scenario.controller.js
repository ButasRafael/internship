import { Scenario } from '../models/scenario.model.js';

export const listScenarios = async (req, res) => {
    res.json(await Scenario.findAllByUser(req.params.userId));
};

export const getScenario = async (req, res) => {
    const sc = await Scenario.findById(req.params.id, req.params.userId);
    if (!sc) return res.status(404).json({ error: 'Scenario not found' });
    res.json(sc);
};

export const createScenario = async (req, res, next) => {
    try {
        const sc = await Scenario.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(sc);
    } catch (err) {
        next(err);
    }
};

export const updateScenario = async (req, res, next) => {
    try {
        const sc = await Scenario.update(req.params.id, req.params.userId, req.body);
        if (!sc) return res.status(404).json({ error: 'Scenario not found' });
        res.json(sc);
    } catch (err) {
        next(err);
    }
};

export const deleteScenario = async (req, res) => {
    await Scenario.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
