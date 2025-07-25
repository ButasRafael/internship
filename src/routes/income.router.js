// src/routes/income.routes.js
import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listIncomes,
    getIncome,
    createIncome,
    updateIncome,
    deleteIncome
} from '../controllers/income.controller.js';

export const incomeRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Income:
 *       type: object
 *       properties:
 *         id:           { type: integer }
 *         user_id:      { type: integer }
 *         received_at:  { type: string, format: date-time }
 *         amount_cents: { type: integer }
 *         currency:     { type: string }
 *         source:       { type: string, enum: [salary, freelance, bonus, dividend, interest, gift, other] }
 *         recurring:    { type: string, enum: [none, weekly, monthly, yearly] }
 *         notes:        { type: string, nullable: true }
 *     IncomeInput:
 *       type: object
 *       required: [received_at, amount_cents, currency]
 *       properties:
 *         received_at:  { type: string, format: date-time }
 *         amount_cents: { type: integer }
 *         currency:     { type: string, default: RON }
 *         source:       { type: string, enum: [salary, freelance, bonus, dividend, interest, gift, other], default: other }
 *         recurring:    { type: string, enum: [none, weekly, monthly, yearly], default: none }
 *         notes:        { type: string, nullable: true }
 */

/**
 * @openapi
 * /api/users/{userId}/incomes:
 *   get:
 *     summary: List incomes
 *     tags: [Incomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Array of incomes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Income'
 */
incomeRouter.get('/', catchAsync(listIncomes));

/**
 * @openapi
 * /api/users/{userId}/incomes/{id}:
 *   get:
 *     summary: Get income
 *     tags: [Incomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Income
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Income'
 *       404:
 *         description: Not found
 */
incomeRouter.get('/:id', catchAsync(getIncome));

/**
 * @openapi
 * /api/users/{userId}/incomes:
 *   post:
 *     summary: Create income
 *     tags: [Incomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncomeInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Income'
 */
incomeRouter.post('/', catchAsync(createIncome));

/**
 * @openapi
 * /api/users/{userId}/incomes/{id}:
 *   put:
 *     summary: Update income
 *     tags: [Incomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncomeInput'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Income'
 */
incomeRouter.put('/:id', catchAsync(updateIncome));

/**
 * @openapi
 * /api/users/{userId}/incomes/{id}:
 *   delete:
 *     summary: Delete income
 *     tags: [Incomes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema: { type: integer }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       204:
 *         description: No Content
 */
incomeRouter.delete('/:id', catchAsync(deleteIncome));
