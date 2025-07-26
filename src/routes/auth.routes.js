import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

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
 *   schemas:
 *     AuthSuccess:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         access_token: { type: string }
 *         token_type:   { type: string, example: bearer }
 *         # Pick ONE of the following to match your implementation:
 *         # expires_in:  { type: integer, example: 900 }   # if you return seconds as a number
 *         expires_in:    { type: string,  example: "7m" }  # if you return a duration string
 *         user:
 *           type: object
 *           properties:
 *             id:      { type: integer }
 *             email:   { type: string, format: email }
 *             role_id: { type: integer }
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
 *             $ref: '#/components/schemas/AuthRegisterInput'
 *     responses:
 *       201:
 *         description: User created + access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
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
 *             $ref: '#/components/schemas/AuthLoginInput'
 *     responses:
 *       200:
 *         description: Access token + refresh cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
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
 *                 email:       { type: string, format: email }
 *                 role_id:     { type: integer }
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
 *     security: []
 *     responses:
 *       200:
 *         description: New access token + rotated refresh cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: false
 *               properties:
 *                 access_token: { type: string }
 *                 token_type:   { type: string, example: bearer }
 *                 # Again, choose type to match your controller:
 *                 # expires_in:  { type: integer, example: 900 }
 *                 expires_in:    { type: string,  example: "7m" }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
