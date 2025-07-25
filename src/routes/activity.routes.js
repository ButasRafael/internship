import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listActivities,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity
} from '../controllers/activity.controller.js';

export const activityRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       properties:
 *         id:                { type: integer }
 *         user_id:           { type: integer }
 *         category_id:       { type: integer, nullable: true }
 *         name:              { type: string }
 *         duration_minutes:  { type: integer }
 *         frequency:         { type: string, enum: [once, weekly, monthly, yearly] }
 *         direct_cost_cents: { type: integer }
 *         saved_minutes:     { type: integer }
 *         currency:          { type: string }
 *         notes:             { type: string, nullable: true }
 *     ActivityInput:
 *       type: object
 *       required: [name, duration_minutes, frequency]
 *       properties:
 *         category_id:       { type: integer, nullable: true }
 *         name:              { type: string }
 *         duration_minutes:  { type: integer }
 *         frequency:         { type: string, enum: [once, weekly, monthly, yearly] }
 *         direct_cost_cents: { type: integer, default: 0 }
 *         saved_minutes:     { type: integer, default: 0 }
 *         currency:          { type: string, default: RON }
 *         notes:             { type: string, nullable: true }
 */

/**
 * @openapi
 * /api/users/{userId}/activities:
 *   get:
 *     summary: List activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Array of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
activityRouter.get('/', catchAsync(listActivities));

/**
 * @openapi
 * /api/users/{userId}/activities/{id}:
 *   get:
 *     summary: Get one activity
 *     tags: [Activities]
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
 *         description: Activity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 */
activityRouter.get('/:id', catchAsync(getActivity));

/**
 * @openapi
 * /api/users/{userId}/activities:
 *   post:
 *     summary: Create activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/ActivityInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
activityRouter.post('/', catchAsync(createActivity));

/**
 * @openapi
 * /api/users/{userId}/activities/{id}:
 *   put:
 *     summary: Update activity
 *     tags: [Activities]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityInput'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
activityRouter.put('/:id', catchAsync(updateActivity));

/**
 * @openapi
 * /api/users/{userId}/activities/{id}:
 *   delete:
 *     summary: Delete activity
 *     tags: [Activities]
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
 *       204:
 *         description: No Content
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
activityRouter.delete('/:id', catchAsync(deleteActivity));
