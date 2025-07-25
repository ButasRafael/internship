import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listGoals,
    getGoal,
    createGoal,
    updateGoal,
    deleteGoal
} from '../controllers/goal.controller.js';

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
 *     tags: [Goals]
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
 */
goalRouter.get('/', catchAsync(listGoals));

/**
 * @openapi
 * /api/users/{userId}/goals/{id}:
 *   get:
 *     summary: Get one goal
 *     tags: [Goals]
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
 *       404:
 *         description: Not found
 */
goalRouter.get('/:id', catchAsync(getGoal));

/**
 * @openapi
 * /api/users/{userId}/goals:
 *   post:
 *     summary: Create goal
 *     tags: [Goals]
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
 */
goalRouter.post('/', catchAsync(createGoal));

/**
 * @openapi
 * /api/users/{userId}/goals/{id}:
 *   put:
 *     summary: Update goal
 *     tags: [Goals]
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
 */
goalRouter.put('/:id', catchAsync(updateGoal));

/**
 * @openapi
 * /api/users/{userId}/goals/{id}:
 *   delete:
 *     summary: Delete goal
 *     tags: [Goals]
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
goalRouter.delete('/:id', catchAsync(deleteGoal));
