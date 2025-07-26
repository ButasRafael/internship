import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

export const userRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:          { type: integer, example: 1 }
 *         email:       { type: string,  example: alice@example.com }
 *         hourly_rate: { type: number,  example: 100 }
 *         currency:    { type: string,  example: RON }
 *         timezone:    { type: string,  example: Europe/Bucharest }
 *         created_at:  { type: string,  format: date-time }
 *     UserInput:
 *       type: object
 *       required: [email, hourly_rate, currency]
 *       properties:
 *         email:       { type: string, example: bob@example.com }
 *         hourly_rate: { type: number, example: 80 }
 *         currency:    { type: string, example: RON }
 */

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List all users
 *     description: Requires `user_view` permission.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
userRouter.get('/', requireAuth, requirePermission('user_view'), catchAsync(listUsers));

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get one user by id
 *     description: Requires `user_view` permission.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: The user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 */
userRouter.get('/:id', requireAuth, requirePermission('user_view'), catchAsync(getUser));

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Requires `user_manage` permission.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
userRouter.post('/', requireAuth, requirePermission('user_manage'), catchAsync(createUser));

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update an existing user
 *     description: Requires `user_manage` permission.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 */
userRouter.put('/:id', requireAuth, requirePermission('user_manage'), catchAsync(updateUser));

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Requires `user_manage` permission.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: No Content – user removed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
userRouter.delete('/:id', requireAuth, requirePermission('user_manage'), catchAsync(deleteUser));
