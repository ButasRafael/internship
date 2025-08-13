import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listGoalContributions,
    getGoalContribution,
    createGoalContribution,
    updateGoalContribution,
    deleteGoalContribution,
} from '../controllers/goalContribution.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

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
 *         contributed_at: { type: string, format: date }
 *         amount_cents:   { type: integer, nullable: true }
 *         hours:          { type: number,  nullable: true }
 *         source_type:    { type: string, enum: [income, expense_cut, activity_saving, manual] }
 *     GoalContributionInput:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         contributed_at: { type: string, format: date, nullable: true }
 *         amount_cents:   { type: integer, nullable: true }
 *         hours:          { type: number,  nullable: true }
 *         source_type:    { type: string, enum: [income, expense_cut, activity_saving, manual], default: manual }
 */

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions:
 *   get:
 *     summary: List contributions for a goal
 *     description: Requires `goal_contribution_view` permission.
 *     tags: [Goal Contributions]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
goalContributionRouter.get(
    '/',
    requireAuth,
    requirePermission('goal_contribution_view'),
    catchAsync(listGoalContributions)
);

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions/{id}:
 *   get:
 *     summary: Get a contribution
 *     description: Requires `goal_contribution_view` permission.
 *     tags: [Goal Contributions]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
goalContributionRouter.get(
    '/:id',
    requireAuth,
    requirePermission('goal_contribution_view'),
    catchAsync(getGoalContribution)
);

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions:
 *   post:
 *     summary: Create a contribution
 *     description: Requires `goal_contribution_manage` permission.
 *     tags: [Goal Contributions]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
goalContributionRouter.post(
    '/',
    requireAuth,
    requirePermission('goal_contribution_manage'),
    catchAsync(createGoalContribution)
);

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions/{id}:
 *   put:
 *     summary: Update a contribution
 *     description: Requires `goal_contribution_manage` permission.
 *     tags: [Goal Contributions]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
goalContributionRouter.put(
    '/:id',
    requireAuth,
    requirePermission('goal_contribution_manage'),
    catchAsync(updateGoalContribution)
);

/**
 * @openapi
 * /api/users/{userId}/goals/{goalId}/contributions/{id}:
 *   delete:
 *     summary: Delete a contribution
 *     description: Requires `goal_contribution_manage` permission.
 *     tags: [Goal Contributions]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
goalContributionRouter.delete(
    '/:id',
    requireAuth,
    requirePermission('goal_contribution_manage'),
    catchAsync(deleteGoalContribution)
);
