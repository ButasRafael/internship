import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listAllocations,
    getAllocation,
    createAllocation,
    updateAllocation,
    deleteAllocation,
} from '../controllers/budgetAllocation.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

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

/**
 * @openapi
 * /api/users/{userId}/budgets/{budgetId}/allocations:
 *   get:
 *     summary: List allocations for a budget
 *     description: Requires `budget_allocation_view` permission.
 *     tags: [Budget Allocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: budgetId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Array of allocations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BudgetAllocation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
budgetAllocationRouter.get(
    '/',
    requireAuth,
    requirePermission('budget_allocation_view'),
    catchAsync(listAllocations)
);

/**
 * @openapi
 * /api/users/{userId}/budgets/{budgetId}/allocations/{id}:
 *   get:
 *     summary: Get allocation by id
 *     description: Requires `budget_allocation_view` permission.
 *     tags: [Budget Allocations]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 */
budgetAllocationRouter.get(
    '/:id',
    requireAuth,
    requirePermission('budget_allocation_view'),
    catchAsync(getAllocation)
);

/**
 * @openapi
 * /api/users/{userId}/budgets/{budgetId}/allocations:
 *   post:
 *     summary: Create allocation
 *     description: Requires `budget_allocation_manage` permission.
 *     tags: [Budget Allocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: budgetId
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetAllocationInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetAllocation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
budgetAllocationRouter.post(
    '/',
    requireAuth,
    requirePermission('budget_allocation_manage'),
    catchAsync(createAllocation)
);

/**
 * @openapi
 * /api/users/{userId}/budgets/{budgetId}/allocations/{id}:
 *   put:
 *     summary: Update allocation
 *     description: Requires `budget_allocation_manage` permission.
 *     tags: [Budget Allocations]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
budgetAllocationRouter.put(
    '/:id',
    requireAuth,
    requirePermission('budget_allocation_manage'),
    catchAsync(updateAllocation)
);

/**
 * @openapi
 * /api/users/{userId}/budgets/{budgetId}/allocations/{id}:
 *   delete:
 *     summary: Delete allocation
 *     description: Requires `budget_allocation_manage` permission.
 *     tags: [Budget Allocations]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
budgetAllocationRouter.delete(
    '/:id',
    requireAuth,
    requirePermission('budget_allocation_manage'),
    catchAsync(deleteAllocation)
);
