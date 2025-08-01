import type { Express } from 'express'
import { authRouter } from './auth.routes.js'
import { apiRouter } from './api/index.js'

export function mountRoutes (app: Express): void {
    app.use('/auth', authRouter)
    app.use('/api',  apiRouter)
}
