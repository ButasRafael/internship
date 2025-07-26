import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listNotificationsForAlert,
    getNotification,
    createNotification,
    deleteNotification,
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

export const notificationRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:           { type: integer }
 *         alert_id:     { type: integer }
 *         sent_at:      { type: string, format: date-time }
 *         channel:      { type: string, enum: [email, telegram, webhook] }
 *         payload_json: { type: object, additionalProperties: true }
 *     NotificationInput:
 *       type: object
 *       required: [channel, payload_json]
 *       properties:
 *         sent_at:      { type: string, format: date-time }
 *         channel:      { type: string, enum: [email, telegram, webhook], default: email }
 *         payload_json: { type: object, additionalProperties: true }
 */

/**
 * @openapi
 * /api/users/{userId}/alerts/{alertId}/notifications:
 *   get:
 *     summary: List notifications for an alert
 *     description: Requires `notification_view` permission.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Notification' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
notificationRouter.get(
    '/',
    requireAuth,
    requirePermission('notification_view'),
    catchAsync(listNotificationsForAlert)
);

/**
 * @openapi
 * /api/users/{userId}/alerts/{alertId}/notifications/{id}:
 *   get:
 *     summary: Get one notification
 *     description: Requires `notification_view` permission.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Notification' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 */
notificationRouter.get(
    '/:id',
    requireAuth,
    requirePermission('notification_view'),
    catchAsync(getNotification)
);

/**
 * @openapi
 * /api/users/{userId}/alerts/{alertId}/notifications:
 *   post:
 *     summary: Manually create (log) a notification
 *     description: Requires `notification_manage` permission.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NotificationInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Notification' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
notificationRouter.post(
    '/',
    requireAuth,
    requirePermission('notification_manage'),
    catchAsync(createNotification)
);

/**
 * @openapi
 * /api/users/{userId}/alerts/{alertId}/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     description: Requires `notification_manage` permission.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: alertId
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
notificationRouter.delete(
    '/:id',
    requireAuth,
    requirePermission('notification_manage'),
    catchAsync(deleteNotification)
);
