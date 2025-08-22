// src/routes/userNotifications.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listNotificationsByUser,
    getNotification,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
} from '../controllers/notification.controller.js';

export const userNotificationsRouter = Router({ mergeParams: true });

// List notifications (supports ?since_id=, ?since_ts=, ?unread=1, ?limit=, ?order=)
userNotificationsRouter.get(
    '/',
    requireAuth,
    requirePermission('notification_view'),
    catchAsync(listNotificationsByUser)
);

// Unread counter for the bell badge
userNotificationsRouter.get(
    '/unread-count',
    requireAuth,
    requirePermission('notification_view'),
    catchAsync(getUnreadCount)
);

// Mark ONE notification as read
userNotificationsRouter.post(
    '/:id/mark-read',
    requireAuth,
    requirePermission('notification_manage'),
    catchAsync(markNotificationRead)
);

// Mark ALL notifications as read
userNotificationsRouter.post(
    '/mark-all-read',
    requireAuth,
    requirePermission('notification_manage'),
    catchAsync(markAllNotificationsRead)
);

// Get one notification
userNotificationsRouter.get(
    '/:id',
    requireAuth,
    requirePermission('notification_view'),
    catchAsync(getNotification)
);
