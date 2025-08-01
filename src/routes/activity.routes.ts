import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listActivities,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
} from '../controllers/activity.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

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
 *       additionalProperties: false
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
 *     description: Requires `activity_view` permission.
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
activityRouter.get(
    '/',
    requireAuth,
    requirePermission('activity_view'),
    catchAsync(listActivities)
);

/**
 * @openapi
 * /api/users/{userId}/activities/{id}:
 *   get:
 *     summary: Get one activity
 *     description: Requires `activity_view` permission.
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
activityRouter.get(
    '/:id',
    requireAuth,
    requirePermission('activity_view'),
    catchAsync(getActivity)
);

/**
 * @openapi
 * /api/users/{userId}/activities:
 *   post:
 *     summary: Create activity
 *     description: Requires `activity_manage` permission.
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
activityRouter.post(
    '/',
    requireAuth,
    requirePermission('activity_manage'),
    catchAsync(createActivity)
);

/**
 * @openapi
 * /api/users/{userId}/activities/{id}:
 *   put:
 *     summary: Update activity
 *     description: Requires `activity_manage` permission.
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
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
activityRouter.put(
    '/:id',
    requireAuth,
    requirePermission('activity_manage'),
    catchAsync(updateActivity)
);

/**
 * @openapi
 * /api/users/{userId}/activities/{id}:
 *   delete:
 *     summary: Delete activity
 *     description: Requires `activity_manage` permission.
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
activityRouter.delete(
    '/:id',
    requireAuth,
    requirePermission('activity_manage'),
    catchAsync(deleteActivity)
);
