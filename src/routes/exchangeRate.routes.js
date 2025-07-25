import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listRates,
    getRate,
    upsertRate,
    deleteRate
} from '../controllers/exchangeRate.controller.js';

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
 *     tags: [Exchange Rates]
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
 */
exchangeRateRouter.get('/', catchAsync(listRates));

/**
 * @openapi
 * /api/exchange-rates/{day}/{base}/{quote}:
 *   get:
 *     summary: Get a specific rate
 *     tags: [Exchange Rates]
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
 *       404:
 *         description: Not found
 */
exchangeRateRouter.get('/:day/:base/:quote', catchAsync(getRate));

/**
 * @openapi
 * /api/exchange-rates:
 *   post:
 *     summary: Upsert an exchange rate (admin)
 *     tags: [Exchange Rates]
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
 */
exchangeRateRouter.post('/', catchAsync(upsertRate));

/**
 * @openapi
 * /api/exchange-rates/{day}/{base}/{quote}:
 *   delete:
 *     summary: Delete a specific rate (admin)
 *     tags: [Exchange Rates]
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
 */
exchangeRateRouter.delete('/:day/:base/:quote', catchAsync(deleteRate));
