import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listAllocations,
    getAllocation,
    createAllocation,
    updateAllocation,
    deleteAllocation
} from '../controllers/budgetAllocation.controller.js';

export const budgetAllocationRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     BudgetAllocation:
 *       type: object
 *       properties:
 *         id:           { type: integer }
 *         budget_id:    { type: integer }
 *         category_id:  { type: integer }
 *         amount_cents: { type: integer }
 *     BudgetAllocationInput:
 *       type: object
 *       required: [category_id, amount_cents]
 *       properties:
 *         category_id:  { type: integer }
 *         amount_cents: { type: integer }
 */

budgetAllocationRouter.get('/', catchAsync(listAllocations));

/**
 * @openapi
 * /api/users/{userId}/budgets/{budgetId}/allocations/{id}:
 *   get:
 *     summary: Get allocation by id
 *     tags: [Budget Allocations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: budgetId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Allocation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetAllocation'
 *       404:
 *         description: Not found
 */
budgetAllocationRouter.get('/:id', catchAsync(getAllocation));

budgetAllocationRouter.post('/', catchAsync(createAllocation));

/**
 * @openapi
 * /api/users/{userId}/budgets/{budgetId}/allocations/{id}:
 *   put:
 *     summary: Update allocation
 *     tags: [Budget Allocations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: budgetId
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
 *             $ref: '#/components/schemas/BudgetAllocationInput'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetAllocation'
 */
budgetAllocationRouter.put('/:id', catchAsync(updateAllocation));

/**
 * @openapi
 * /api/users/{userId}/budgets/{budgetId}/allocations/{id}:
 *   delete:
 *     summary: Delete allocation
 *     tags: [Budget Allocations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: budgetId
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
budgetAllocationRouter.delete('/:id', catchAsync(deleteAllocation));
