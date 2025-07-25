import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listNotificationsForAlert,
    getNotification,
    createNotification,
    deleteNotification
} from '../controllers/notification.controller.js';

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
 *     tags: [Notifications]
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
 */
notificationRouter.get('/', catchAsync(listNotificationsForAlert));


/**
 * @openapi
 * /api/users/{userId}/alerts/{alertId}/notifications/{id}:
 *   get:
 *     summary: Get one notification
 *     tags: [Notifications]
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
 *       404:
 *         description: Not found
 */
notificationRouter.get('/:id', catchAsync(getNotification));

/**
 * @openapi
 * /api/users/{userId}/alerts/{alertId}/notifications:
 *   post:
 *     summary: Manually create (log) a notification
 *     tags: [Notifications]
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
 */
notificationRouter.post('/', catchAsync(createNotification));

/**
 * @openapi
 * /api/users/{userId}/alerts/{alertId}/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
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
 */
notificationRouter.delete('/:id', catchAsync(deleteNotification));
