import { logger } from '../utils/logger.js';

export const errorHandler = (err, _req, res, _next) => {
    if (res.headersSent) return; // avoid double send

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Duplicate entry' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ error: 'Referenced resource does not exist' });
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ error: 'Resource is referenced elsewhere' });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }
    logger.error(err);
    res.status(500).json({ error: 'Internal server error' });
};
