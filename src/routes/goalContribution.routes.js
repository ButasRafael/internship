// src/routes/goalContribution.routes.js
import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listGoalContributions,
    getGoalContribution,
    createGoalContribution,
    updateGoalContribution,
    deleteGoalContribution
} from '../controllers/goalContribution.controller.js';

export const goalContributionRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     GoalContribution:
 *       type: object
 *       properties:
 *         id:             { type: integer }
 *         goal_id:        { type: integer }
 *         contributed_at: { type: string, format: date-time }
 *         amount_cents:   { type: integer, nullable: true }
 *         hours:          { type: number,  nullable: true }
 *         source_type:    { type: string, enum: [income, expense_cut, activity_saving, manual] }
 *     GoalContributionInput:
 *       type: object
 *       properties:
 *         contributed_at: { type: string, format: date-time, nullable: true }
 *         amount_cents:   { type: integer, nullable: true }
 *         hours:          { type: number,  nullable: true }
 *         source_type:    { type: string, enum: [income, expense_cut, activity_saving, manual], default: manual }
 */

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions:
 *   get:
 *     summary: List contributions for a goal
 *     tags: [Goal Contributions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of contributions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/GoalContribution' }
 */
goalContributionRouter.get('/', catchAsync(listGoalContributions));

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions/{id}:
 *   get:
 *     summary: Get a contribution
 *     tags: [Goal Contributions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Contribution
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GoalContribution' }
 *       404:
 *         description: Not found
 */
goalContributionRouter.get('/:id', catchAsync(getGoalContribution));

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions:
 *   post:
 *     summary: Create a contribution
 *     tags: [Goal Contributions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GoalContributionInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GoalContribution' }
 */
goalContributionRouter.post('/', catchAsync(createGoalContribution));

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions/{id}:
 *   put:
 *     summary: Update a contribution
 *     tags: [Goal Contributions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: goalId
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
 *           schema: { $ref: '#/components/schemas/GoalContributionInput' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GoalContribution' }
 *       404:
 *         description: Not found
 */
goalContributionRouter.put('/:id', catchAsync(updateGoalContribution));

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions/{id}:
 *   delete:
 *     summary: Delete a contribution
 *     tags: [Goal Contributions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: goalId
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
goalContributionRouter.delete('/:id', catchAsync(deleteGoalContribution));
