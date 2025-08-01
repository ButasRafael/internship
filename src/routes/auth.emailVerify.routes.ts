import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { sendVerification, verifyEmail } from '../controllers/emailVerify.controller.js';

export const emailVerifyRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     EmailVerifyRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email: { type: string, format: email, example: bob@example.com }
 */

/**
 * @openapi
 * /auth/email-verification:
 *   post:
 *     summary: Send e-mail verification link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EmailVerifyRequest' }
 *     responses:
 *       200: { description: Always OK }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
emailVerifyRouter.post('/', catchAsync(sendVerification));

/**
 * @openapi
 * /auth/email-verification/{token}:
 *   post:
 *     summary: Confirm e-mail address
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Verified }
 *       400:
 *         description: Invalid / expired token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
emailVerifyRouter.post('/:token', catchAsync(verifyEmail));
