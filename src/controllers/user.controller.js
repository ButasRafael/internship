import { User } from '../models/user.model.js';

export const listUsers = async (_req, res) => {
    res.json(await User.findAll());
};

export const getUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
};

export const createUser = async (req, res, next) => {
    try {
        const { role_id = 2, ...safe } = req.body;
        const user = await User.create({
            ...safe,
            role_id
        });
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const user = await User.update(req.params.id, req.body);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (req, res) => {
    await User.remove(req.params.id);
    res.status(204).send();
};
