import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget
} from '../controllers/budget.controller.js';

export const budgetRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       properties:
 *         id:           { type: integer }
 *         user_id:      { type: integer }
 *         period_start: { type: string, format: date }
 *         period_end:   { type: string, format: date }
 *         currency:     { type: string }
 *         created_at:   { type: string, format: date-time }
 *     BudgetInput:
 *       type: object
 *       required: [period_start, period_end, currency]
 *       properties:
 *         period_start: { type: string, format: date }
 *         period_end:   { type: string, format: date }
 *         currency:     { type: string, default: RON }
 */

/**
 * @openapi
 * /api/users/{userId}/budgets:
 *   get:
 *     summary: List budgets
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of budgets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Budget' }
 */
budgetRouter.get('/', catchAsync(listBudgets));

/**
 * @openapi
 * /api/users/{userId}/budgets/{id}:
 *   get:
 *     summary: Get a budget
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Budget
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Budget' }
 *       404:
 *         description: Not found
 */
budgetRouter.get('/:id', catchAsync(getBudget));

/**
 * @openapi
 * /api/users/{userId}/budgets:
 *   post:
 *     summary: Create budget
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BudgetInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Budget' }
 */
budgetRouter.post('/', catchAsync(createBudget));

/**
 * @openapi
 * /api/users/{userId}/budgets/{id}:
 *   put:
 *     summary: Update budget
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BudgetInput' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Budget' }
 */
budgetRouter.put('/:id', catchAsync(updateBudget));

/**
 * @openapi
 * /api/users/{userId}/budgets/{id}:
 *   delete:
 *     summary: Delete budget
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: No Content
 */
budgetRouter.delete('/:id', catchAsync(deleteBudget));
