import { authRouter } from './auth.routes.js';
import { apiRouter } from './api/index.js';

export function mountRoutes(app) {
    app.use('/auth', authRouter);
    app.use('/api', apiRouter);
}
