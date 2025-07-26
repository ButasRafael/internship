import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listObjects,
    getObject,
    createObject,
    updateObject,
    deleteObject,
} from '../controllers/object.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

export const objectRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     ObjectItem:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         user_id: { type: integer }
 *         category_id: { type: integer, nullable: true }
 *         name: { type: string, example: Espressor }
 *         price_cents: { type: integer, example: 120000 }
 *         currency: { type: string, example: RON }
 *         purchase_date: { type: string, format: date }
 *         expected_life_months: { type: integer, example: 24 }
 *         maintenance_cents_per_month: { type: integer, example: 0 }
 *         hours_saved_per_month: { type: number, example: 2.5 }
 *         notes: { type: string, nullable: true }
 *     ObjectInput:
 *       type: object
 *       required:
 *         - name
 *         - price_cents
 *         - currency
 *         - purchase_date
 *         - expected_life_months
 *       properties:
 *         category_id: { type: integer, nullable: true }
 *         name: { type: string }
 *         price_cents: { type: integer }
 *         currency: { type: string }
 *         purchase_date: { type: string, format: date }
 *         expected_life_months: { type: integer }
 *         maintenance_cents_per_month: { type: integer, default: 0 }
 *         hours_saved_per_month: { type: number, default: 0 }
 *         notes: { type: string, nullable: true }
 */

/**
 * @openapi
 * /api/users/{userId}/objects:
 *   get:
 *     summary: List objects for a user
 *     description: Requires `object_view` permission.
 *     tags: [Objects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ObjectItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
objectRouter.get(
    '/',
    requireAuth,
    requirePermission('object_view'),
    catchAsync(listObjects)
);

/**
 * @openapi
 * /api/users/{userId}/objects/{id}:
 *   get:
 *     summary: Get one object
 *     description: Requires `object_view` permission.
 *     tags: [Objects]
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
 *         description: The object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ObjectItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 */
objectRouter.get(
    '/:id',
    requireAuth,
    requirePermission('object_view'),
    catchAsync(getObject)
);

/**
 * @openapi
 * /api/users/{userId}/objects:
 *   post:
 *     summary: Create an object
 *     description: Requires `object_manage` permission.
 *     tags: [Objects]
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
 *             $ref: '#/components/schemas/ObjectInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ObjectItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
objectRouter.post(
    '/',
    requireAuth,
    requirePermission('object_manage'),
    catchAsync(createObject)
);

/**
 * @openapi
 * /api/users/{userId}/objects/{id}:
 *   put:
 *     summary: Update an object
 *     description: Requires `object_manage` permission.
 *     tags: [Objects]
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
 *             $ref: '#/components/schemas/ObjectInput'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ObjectItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
objectRouter.put(
    '/:id',
    requireAuth,
    requirePermission('object_manage'),
    catchAsync(updateObject)
);

/**
 * @openapi
 * /api/users/{userId}/objects/{id}:
 *   delete:
 *     summary: Delete an object
 *     description: Requires `object_manage` permission.
 *     tags: [Objects]
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
objectRouter.delete(
    '/:id',
    requireAuth,
    requirePermission('object_manage'),
    catchAsync(deleteObject)
);
