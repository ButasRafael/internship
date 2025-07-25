import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense
} from '../controllers/expense.controller.js';

export const expenseRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       properties:
 *         id:           { type: integer, example: 10 }
 *         user_id:      { type: integer, example: 1 }
 *         category_id:  { type: integer, nullable: true }
 *         name:         { type: string,  example: Chirie }
 *         amount_cents: { type: integer, example: 200000, description: bani / cents }
 *         currency:     { type: string,  example: RON }
 *         frequency:    { type: string,  enum: [once, weekly, monthly, yearly] }
 *         start_date:   { type: string,  format: date }
 *         end_date:     { type: string,  format: date, nullable: true }
 *         is_active:    { type: boolean, example: true }
 *         notes:        { type: string,  nullable: true }
 *     ExpenseInput:
 *       type: object
 *       required: [name, amount_cents, currency, frequency, start_date]
 *       properties:
 *         category_id:  { type: integer, nullable: true }
 *         name:         { type: string,  example: Netflix }
 *         amount_cents: { type: integer, example: 5999 }
 *         currency:     { type: string,  example: RON }
 *         frequency:    { type: string,  enum: [once, weekly, monthly, yearly] }
 *         start_date:   { type: string,  format: date }
 *         end_date:     { type: string,  format: date, nullable: true }
 *         is_active:    { type: boolean, default: true }
 *         notes:        { type: string,  nullable: true }
 */

/**
 * @openapi
 * /api/users/{userId}/expenses:
 *   get:
 *     summary: List all expenses for a user
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 */
expenseRouter.get('/', catchAsync(listExpenses));

/**
 * @openapi
 * /api/users/{userId}/expenses/{id}:
 *   get:
 *     summary: Get one expense
 *     tags: [Expenses]
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
 *         description: Expense
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       404:
 *         description: Not found
 */
expenseRouter.get('/:id', catchAsync(getExpense));

/**
 * @openapi
 * /api/users/{userId}/expenses:
 *   post:
 *     summary: Add a new expense for a user
 *     tags: [Expenses]
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
 *             $ref: '#/components/schemas/ExpenseInput'
 *     responses:
 *       201:
 *         description: Expense created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 */
expenseRouter.post('/', catchAsync(createExpense));

/**
 * @openapi
 * /api/users/{userId}/expenses/{id}:
 *   put:
 *     summary: Update an expense
 *     tags: [Expenses]
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
 *             $ref: '#/components/schemas/ExpenseInput'
 *     responses:
 *       200:
 *         description: Updated expense
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 */
expenseRouter.put('/:id', catchAsync(updateExpense));

/**
 * @openapi
 * /api/users/{userId}/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
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
 *         description: No Content – expense removed
 */
expenseRouter.delete('/:id', catchAsync(deleteExpense));
