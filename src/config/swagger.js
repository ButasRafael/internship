import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.js';

const definition = {
    openapi: '3.0.0',
    info: {
        title: 'Time‑is‑Money API',
        version: '0.1.0',
        description: 'See expenses in hours & take smarter spending decisions',
    },
    servers: [{ url: `http://localhost:${env.port}`, description: 'Local dev' }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
            accessCookie: {
                type: 'apiKey',
                in: 'cookie',
                name: 'access_token',
                description: 'HttpOnly access token cookie',
            },
            refreshCookie: {
                type: 'apiKey',
                in: 'cookie',
                name: 'refresh_token',
                description: 'HttpOnly refresh token cookie',
            },
        },
        responses: {
            Unauthorized: {
                description: 'Unauthenticated',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
            Forbidden: {
                description: 'Forbidden',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
            NotFound: {
                description: 'Not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
        },
        schemas: {
            AuthRegisterInput: {
                type: 'object',
                required: ['email', 'password'],
                additionalProperties: false,
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                },
            },
            AuthLoginInput: {
                type: 'object',
                required: ['email', 'password'],
                additionalProperties: false,
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
            },
            AuthTokens: {
                type: 'object',
                properties: {
                    access_token: { type: 'string', description: 'JWT access token (also set in cookie if you do that)' },
                    expires_in: { type: 'integer', example: 900 },
                },
            },
            Me: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    email: { type: 'string' },
                    role: { type: 'string', enum: ['user', 'admin'] },
                    token_version: { type: 'integer' },
                },
            },
            ErrorResponse: {
                type: 'object',
                required: ['error'],
                properties: {
                    error: { type: 'string' },
                },
                additionalProperties: false,
            },
        },
    },
    security: [{ bearerAuth: [], accessCookie: [] }],
};

export const swaggerSpec = swaggerJSDoc({
    definition,
    apis: ['./src/routes/**/*.js', './src/routes/**/*.ts'],
});

export function setupSwaggerUI(app) {
    if (env.nodeEnv !== 'production') {
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
        console.log(`Swagger UI: http://localhost:${env.port}/api-docs`);
    }
}
