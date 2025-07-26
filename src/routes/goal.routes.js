import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listGoals,
    getGoal,
    createGoal,
    updateGoal,
    deleteGoal,
} from '../controllers/goal.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

export const goalRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Goal:
 *       type: object
 *       properties:
 *         id:                  { type: integer }
 *         user_id:             { type: integer }
 *         name:                { type: string }
 *         target_amount_cents: { type: integer, nullable: true }
 *         target_hours:        { type: number,  nullable: true }
 *         deadline_date:       { type: string, format: date, nullable: true }
 *         priority:            { type: integer }
 *         status:              { type: string, enum: [active, paused, done, cancelled] }
 *         currency:            { type: string }
 *         created_at:          { type: string, format: date-time }
 *     GoalInput:
 *       type: object
 *       required: [name, currency]
 *       additionalProperties: false
 *       properties:
 *         name:                { type: string }
 *         target_amount_cents: { type: integer, nullable: true }
 *         target_hours:        { type: number,  nullable: true }
 *         deadline_date:       { type: string, format: date, nullable: true }
 *         priority:            { type: integer, default: 3 }
 *         status:              { type: string, enum: [active, paused, done, cancelled], default: active }
 *         currency:            { type: string, default: RON }
 */

/**
 * @openapi
 * /api/users/{userId}/goals:
 *   get:
 *     summary: List goals
 *     description: Requires `goal_view` permission.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Array of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Goal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
goalRouter.get(
    '/',
    requireAuth,
    requirePermission('goal_view'),
    catchAsync(listGoals)
);

/**
 * @openapi
 * /api/users/{userId}/goals/{id}:
 *   get:
 *     summary: Get one goal
 *     description: Requires `goal_view` permission.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
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
 *         description: The goal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
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
goalRouter.get(
    '/:id',
    requireAuth,
    requirePermission('goal_view'),
    catchAsync(getGoal)
);

/**
 * @openapi
 * /api/users/{userId}/goals:
 *   post:
 *     summary: Create goal
 *     description: Requires `goal_manage` permission.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoalInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
goalRouter.post(
    '/',
    requireAuth,
    requirePermission('goal_manage'),
    catchAsync(createGoal)
);

/**
 * @openapi
 * /api/users/{userId}/goals/{id}:
 *   put:
 *     summary: Update goal
 *     description: Requires `goal_manage` permission.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
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
 *           schema:
 *             $ref: '#/components/schemas/GoalInput'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
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
goalRouter.put(
    '/:id',
    requireAuth,
    requirePermission('goal_manage'),
    catchAsync(updateGoal)
);

/**
 * @openapi
 * /api/users/{userId}/goals/{id}:
 *   delete:
 *     summary: Delete goal
 *     description: Requires `goal_manage` permission.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
goalRouter.delete(
    '/:id',
    requireAuth,
    requirePermission('goal_manage'),
    catchAsync(deleteGoal)
);
