// src/routes/auth.routes.js
import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    register,
    login,
    refresh,
    logout,
    me
} from '../controllers/auth.controller.js';
import {requireAuth} from "../middlewares/auth.js";

export const authRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string, format: password }
 *               hourly_rate: { type: number, default: 0 }
 *               currency:    { type: string, default: RON }
 *               timezone:    { type: string, default: Europe/Bucharest }
 *     responses:
 *       201:
 *         description: User created + access token
 */
authRouter.post('/register', catchAsync(register));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Access token + refresh cookie
 */
authRouter.post('/login', catchAsync(login));

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:          { type: integer }
 *                 email:       { type: string }
 *                 role:        { type: string, enum: [user, admin] }
 *                 hourly_rate: { type: number }
 *                 currency:    { type: string }
 *                 timezone:    { type: string }
 *                 created_at:  { type: string, format: date-time }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
authRouter.get('/me', requireAuth, catchAsync(me));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token (uses httpOnly cookie)
 *     tags: [Auth]
 *     security:
 *     - refreshCookie: []
 *     responses:
 *       200:
 *         description: New access token + rotated refresh cookie
 */
authRouter.post('/refresh', catchAsync(refresh));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout (revoke refresh tokens)
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       204:
 *         description: No content
 */
authRouter.post('/logout', catchAsync(logout));
