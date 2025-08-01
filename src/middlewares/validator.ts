import OpenApiValidator from 'express-openapi-validator'
import { swaggerSpec } from '../config/swagger.js'
import { storage, fileFilter } from './upload.js'

export const openapiValidator = OpenApiValidator.middleware({
    apiSpec: swaggerSpec as any,

    ignoreUndocumented: true,
    validateSecurity: false,

    fileUploader: {
        storage,
        limits: { fileSize: 2 * 1024 * 1024 },
        fileFilter
    },

    validateRequests: {
        allowUnknownQueryParameters: false,
        coerceTypes: true
    }

})
