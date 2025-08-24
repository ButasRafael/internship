import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { catchAsync } from '../utils/catchAsync.js';
import { listRates, upsertRate } from '../controllers/userHourlyRate.controller.js';

export const userHourlyRateRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /api/users/{userId}/hourly-rates:
 *   get:
 *     summary: List effective hourly rates
 *     description: Returns monthly rates; if from/to are provided, the result is filled forward for each month in range.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, example: 2025-01 }
 *       - in: query
 *         name: to
 *         schema: { type: string, example: 2025-12 }
 *     responses:
 *       200:
 *         description: Array of { month, hourly_rate }
 */
userHourlyRateRouter.get('/', requireAuth, catchAsync(listRates));

/**
 * @openapi
 * /api/users/{userId}/hourly-rates:
 *   put:
 *     summary: Upsert a monthly hourly rate
 *     description: Sets the hourly rate effective for a given calendar month.
 *     tags: [Users]
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
 *             type: object
 *             required: [month, hourly_rate]
 *             properties:
 *               month: { type: string, example: 2025-03 }
 *               hourly_rate: { type: number, example: 120 }
 *     responses:
 *       200:
 *         description: Upserted { month, hourly_rate }
 */
userHourlyRateRouter.put('/', requireAuth, catchAsync(upsertRate));

