import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listAlerts,
    getAlert,
    createAlert,
    updateAlert,
    deleteAlert,
} from '../controllers/alert.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

export const alertRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Alert:
 *       type: object
 *       properties:
 *         id:         { type: integer }
 *         user_id:    { type: integer }
 *         name:       { type: string }
 *         rule_type:  { type: string, enum: [percent_expenses_of_income, object_breakeven_reached, budget_overrun] }
 *         rule_config:
 *           type: object
 *           additionalProperties: true
 *         is_active:  { type: boolean }
 *         created_at: { type: string, format: date-time }
 *     AlertInput:
 *       type: object
 *       required: [name, rule_type, rule_config]
 *       properties:
 *         name:       { type: string }
 *         rule_type:  { type: string, enum: [percent_expenses_of_income, object_breakeven_reached, budget_overrun] }
 *         rule_config:
 *           type: object
 *           additionalProperties: true
 *         is_active:  { type: boolean, default: true }
 */

/**
 * @openapi
 * /api/users/{userId}/alerts:
 *   get:
 *     summary: List user alerts
 *     description: Requires `alert_view` permission.
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Alert' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
alertRouter.get(
    '/',
    requireAuth,
    requirePermission('alert_view'),
    catchAsync(listAlerts)
);

/**
 * @openapi
 * /api/users/{userId}/alerts/{id}:
 *   get:
 *     summary: Get alert by id
 *     description: Requires `alert_view` permission.
 *     tags: [Alerts]
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
 *       200:
 *         description: Alert
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Alert' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 */
alertRouter.get(
    '/:id',
    requireAuth,
    requirePermission('alert_view'),
    catchAsync(getAlert)
);

/**
 * @openapi
 * /api/users/{userId}/alerts:
 *   post:
 *     summary: Create alert
 *     description: Requires `alert_manage` permission.
 *     tags: [Alerts]
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
 *           schema: { $ref: '#/components/schemas/AlertInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Alert' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
alertRouter.post(
    '/',
    requireAuth,
    requirePermission('alert_manage'),
    catchAsync(createAlert)
);

/**
 * @openapi
 * /api/users/{userId}/alerts/{id}:
 *   put:
 *     summary: Update alert
 *     description: Requires `alert_manage` permission.
 *     tags: [Alerts]
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
 *           schema: { $ref: '#/components/schemas/AlertInput' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Alert' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
alertRouter.put(
    '/:id',
    requireAuth,
    requirePermission('alert_manage'),
    catchAsync(updateAlert)
);

/**
 * @openapi
 * /api/users/{userId}/alerts/{id}:
 *   delete:
 *     summary: Delete alert
 *     description: Requires `alert_manage` permission.
 *     tags: [Alerts]
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
alertRouter.delete(
    '/:id',
    requireAuth,
    requirePermission('alert_manage'),
    catchAsync(deleteAlert)
);
