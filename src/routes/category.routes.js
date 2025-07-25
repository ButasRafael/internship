import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/category.controller.js';

export const categoryRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:       { type: integer }
 *         user_id:  { type: integer }
 *         name:     { type: string }
 *         kind:     { type: string, enum: [expense, object, activity, mixed] }
 *     CategoryInput:
 *       type: object
 *       required: [name, kind]
 *       properties:
 *         name:     { type: string }
 *         kind:     { type: string, enum: [expense, object, activity, mixed] }
 */

/**
 * @openapi
 * /api/users/{userId}/categories:
 *   get:
 *     summary: List categories for a user
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Array of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
categoryRouter.get('/', catchAsync(listCategories));

/**
 * @openapi
 * /api/users/{userId}/categories/{id}:
 *   get:
 *     summary: Get one category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: The category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Not found
 */
categoryRouter.get('/:id', catchAsync(getCategory));

/**
 * @openapi
 * /api/users/{userId}/categories:
 *   post:
 *     summary: Create category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
categoryRouter.post('/', catchAsync(createCategory));

/**
 * @openapi
 * /api/users/{userId}/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
categoryRouter.put('/:id', catchAsync(updateCategory));

/**
 * @openapi
 * /api/users/{userId}/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       204:
 *         description: No Content
 */
categoryRouter.delete('/:id', catchAsync(deleteCategory));
