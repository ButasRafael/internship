import { Category } from '../models/category.model.js';

export const listCategories = async (req, res) => {
    res.json(await Category.findAllByUser(req.params.userId));
};

export const getCategory = async (req, res) => {
    const cat = await Category.findById(req.params.id, req.params.userId);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json(cat);
};

export const createCategory = async (req, res, next) => {
    try {
        const category = await Category.create({ user_id: req.params.userId, ...req.body });
        res.status(201).json(category);
    } catch (err) {
        next(err);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.update(req.params.id, req.params.userId, req.body);
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.json(category);
    } catch (err) {
        next(err);
    }
};

export const deleteCategory = async (req, res) => {
    await Category.remove(req.params.id, req.params.userId);
    res.status(204).send();
};
