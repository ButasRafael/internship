import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import cors from 'cors'

import { setupSwaggerUI }   from './config/swagger.js'
import { errorHandler }     from './middlewares/errorHandler.js'
import { verifyAccessToken } from './middlewares/auth.js'
import { openapiValidator }  from './middlewares/validator.js'
import { mountRoutes }       from './routes/index.js'
import { env }               from './config/env.js'
import { swaggerSpec } from './config/swagger.js';

export function createApp () {
    const app = express()

    const corsOptions: cors.CorsOptions = {
        origin: env.frontendUrl,
        credentials: true,
        methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
        allowedHeaders: ['Content-Type','Authorization'],
    }
    app.use(cors(corsOptions))
    app.options('*', cors(corsOptions))

    app.use(express.json())
    app.use(cookieParser())

    app.use('/uploads', express.static(path.resolve('uploads')))

    app.use(verifyAccessToken)
    app.use(openapiValidator)

    app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

    mountRoutes(app)
    setupSwaggerUI(app)
    app.get('/api-docs-json', (_req, res) => res.json(swaggerSpec));
    app.use(errorHandler)

    return app
}
