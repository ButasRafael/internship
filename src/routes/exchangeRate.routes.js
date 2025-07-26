import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listRates,
    getRate,
    upsertRate,
    deleteRate,
} from '../controllers/exchangeRate.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

export const exchangeRateRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ExchangeRate:
 *       type: object
 *       properties:
 *         day:   { type: string, format: date }
 *         base:  { type: string }
 *         quote: { type: string }
 *         rate:  { type: number }
 *     ExchangeRateInput:
 *       type: object
 *       required: [day, base, quote, rate]
 *       additionalProperties: false
 *       properties:
 *         day:   { type: string, format: date }
 *         base:  { type: string, example: EUR }
 *         quote: { type: string, example: RON }
 *         rate:  { type: number, example: 4.97 }
 */

/**
 * @openapi
 * /api/exchange-rates:
 *   get:
 *     summary: List / query exchange rates
 *     description: Requires `exchange_rate_view` permission.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: day
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: base
 *         schema: { type: string }
 *       - in: query
 *         name: quote
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of rates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ExchangeRate' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
exchangeRateRouter.get(
    '/',
    requireAuth,
    requirePermission('exchange_rate_view'),
    catchAsync(listRates)
);

/**
 * @openapi
 * /api/exchange-rates/{day}/{base}/{quote}:
 *   get:
 *     summary: Get a specific rate
 *     description: Requires `exchange_rate_view` permission.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: day
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: path
 *         name: base
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: quote
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rate
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ExchangeRate' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exchangeRateRouter.get(
    '/:day/:base/:quote',
    requireAuth,
    requirePermission('exchange_rate_view'),
    catchAsync(getRate)
);

/**
 * @openapi
 * /api/exchange-rates:
 *   post:
 *     summary: Upsert an exchange rate
 *     description: Requires `exchange_rate_manage` permission.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ExchangeRateInput' }
 *     responses:
 *       200:
 *         description: Upserted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ExchangeRate' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
exchangeRateRouter.post(
    '/',
    requireAuth,
    requirePermission('exchange_rate_manage'),
    catchAsync(upsertRate)
);

/**
 * @openapi
 * /api/exchange-rates/{day}/{base}/{quote}:
 *   delete:
 *     summary: Delete a specific rate
 *     description: Requires `exchange_rate_manage` permission.
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: day
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: path
 *         name: base
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: quote
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: No Content
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
exchangeRateRouter.delete(
    '/:day/:base/:quote',
    requireAuth,
    requirePermission('exchange_rate_manage'),
    catchAsync(deleteRate)
);
