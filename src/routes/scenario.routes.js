// src/routes/scenario.routes.js
import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listScenarios,
    getScenario,
    createScenario,
    updateScenario,
    deleteScenario
} from '../controllers/scenario.controller.js';

export const scenarioRouter = Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   schemas:
 *     Scenario:
 *       type: object
 *       properties:
 *         id:          { type: integer }
 *         user_id:     { type: integer }
 *         name:        { type: string }
 *         params_json: { type: object, additionalProperties: true }
 *         created_at:  { type: string, format: date-time }
 *     ScenarioInput:
 *       type: object
 *       required: [name, params_json]
 *       properties:
 *         name:        { type: string }
 *         params_json: { type: object, additionalProperties: true }
 */

/**
 * @openapi
 * /api/users/{userId}/scenarios:
 *   get:
 *     summary: List scenarios
 *     tags: [Scenarios]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of scenarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Scenario' }
 */
scenarioRouter.get('/', catchAsync(listScenarios));

/**
 * @openapi
 * /api/users/{userId}/scenarios/{id}:
 *   get:
 *     summary: Get one scenario
 *     tags: [Scenarios]
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
 *         description: The scenario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Scenario' }
 *       404:
 *         description: Not found
 */
scenarioRouter.get('/:id', catchAsync(getScenario));

/**
 * @openapi
 * /api/users/{userId}/scenarios:
 *   post:
 *     summary: Create scenario
 *     tags: [Scenarios]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ScenarioInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Scenario' }
 */
scenarioRouter.post('/', catchAsync(createScenario));

/**
 * @openapi
 * /api/users/{userId}/scenarios/{id}:
 *   put:
 *     summary: Update scenario
 *     tags: [Scenarios]
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
 *           schema: { $ref: '#/components/schemas/ScenarioInput' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Scenario' }
 */
scenarioRouter.put('/:id', catchAsync(updateScenario));

/**
 * @openapi
 * /api/users/{userId}/scenarios/{id}:
 *   delete:
 *     summary: Delete scenario
 *     tags: [Scenarios]
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
 *         description: No Content
 */
scenarioRouter.delete('/:id', catchAsync(deleteScenario));
