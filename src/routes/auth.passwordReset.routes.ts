import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { requestReset, performReset } from '../controllers/passwordReset.controller.js';

export const pwdResetRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PasswordResetRequest:
 *       type: object
 *       required: [email]
 *       additionalProperties: false
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: alice@example.com
 *     PasswordResetPerform:
 *       type: object
 *       required: [password]
 *       additionalProperties: false
 *       properties:
 *         password:
 *           type: string
 *           minLength: 8
 *           example: N3w-pa$$w0rd
 */

/**
 * @openapi
 * /auth/password-reset:
 *   post:
 *     summary: Request a password‑reset link
 *     description: Sends an e‑mail containing a one‑time reset link. Always returns **200** even if the e‑mail isn’t found, to avoid user enumeration.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
pwdResetRouter.post('/', catchAsync(requestReset));

/**
 * @openapi
 * /auth/password-reset/{token}:
 *   post:
 *     summary: Reset password using the token
 *     description: Consumes a valid, unused, unexpired token and sets a new password.
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetPerform'
 *     responses:
 *       204:
 *         description: Password changed, no content.
 *       400:
 *         description: Invalid / expired token or missing password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pwdResetRouter.post('/:token', catchAsync(performReset));
