import OpenApiValidator from 'express-openapi-validator';
import { swaggerSpec } from '../config/swagger.js';

export const openapiValidator = OpenApiValidator.middleware({
    apiSpec: swaggerSpec,

    ignoreUndocumented: true,

    validateSecurity: false,

    validateRequests: {
        allowUnknownQueryParameters: false,
        coerceTypes: true,
    },

    ajvFormats: true,
    ajvOptions: {
        useDefaults: true,
        removeAdditional: false,
        allErrors: false,
    },
});
