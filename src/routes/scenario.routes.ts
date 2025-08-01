import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
    listScenarios,
    getScenario,
    createScenario,
    updateScenario,
    deleteScenario,
} from '../controllers/scenario.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

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
 *       additionalProperties: false
 *       properties:
 *         name:        { type: string }
 *         params_json: { type: object, additionalProperties: true }
 */

/**
 * @openapi
 * /api/users/{userId}/scenarios:
 *   get:
 *     summary: List scenarios
 *     description: Requires `scenario_view` permission.
 *     tags: [Scenarios]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
scenarioRouter.get('/', requireAuth, requirePermission('scenario_view'), catchAsync(listScenarios));

/**
 * @openapi
 * /api/users/{userId}/scenarios/{id}:
 *   get:
 *     summary: Get one scenario
 *     description: Requires `scenario_view` permission.
 *     tags: [Scenarios]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
scenarioRouter.get('/:id', requireAuth, requirePermission('scenario_view'), catchAsync(getScenario));

/**
 * @openapi
 * /api/users/{userId}/scenarios:
 *   post:
 *     summary: Create scenario
 *     description: Requires `scenario_manage` permission.
 *     tags: [Scenarios]
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
 *           schema: { $ref: '#/components/schemas/ScenarioInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Scenario' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
scenarioRouter.post('/', requireAuth, requirePermission('scenario_manage'), catchAsync(createScenario));

/**
 * @openapi
 * /api/users/{userId}/scenarios/{id}:
 *   put:
 *     summary: Update scenario
 *     description: Requires `scenario_manage` permission.
 *     tags: [Scenarios]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
scenarioRouter.put('/:id', requireAuth, requirePermission('scenario_manage'), catchAsync(updateScenario));

/**
 * @openapi
 * /api/users/{userId}/scenarios/{id}:
 *   delete:
 *     summary: Delete scenario
 *     description: Requires `scenario_manage` permission.
 *     tags: [Scenarios]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
scenarioRouter.delete('/:id', requireAuth, requirePermission('scenario_manage'), catchAsync(deleteScenario));
