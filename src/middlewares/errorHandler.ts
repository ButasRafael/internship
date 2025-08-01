import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

interface SqlError {
    code?: string
    status?: number
    errors?: any[]
    type?: string
}

export const errorHandler = (
    err: SqlError,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (res.headersSent) return

    if (err?.status && Array.isArray(err.errors)) {
        const msg =
            err.errors
                .map(e => e.message || `${e.path}: ${e.error}`)
                .join('; ') || 'Request validation failed'
        res.status(err.status).json({ error: msg })
        return
    }

    if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Duplicate entry' })
        return
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        res.status(400).json({ error: 'Referenced resource does not exist' })
        return
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(409).json({ error: 'Resource is referenced elsewhere' })
        return
    }
    if (err.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'Invalid JSON body' })
        return
    }

    logger.error(err)
    res.status(500).json({ error: 'Internal server error' })
}
