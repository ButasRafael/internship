import { Router } from 'express';
import { requireAuth, requireRole, requireSelfOrAdmin } from '../../middlewares/auth.js';

import { userRouter } from '../user.routes.js';
import { exchangeRateRouter } from '../exchangeRate.routes.js';

import { perUserRouter } from './perUser.routes.js';

export const apiRouter = Router();

apiRouter.use(
    '/users/:userId',
    requireAuth,
    requireSelfOrAdmin('userId'),
    perUserRouter
);

apiRouter.use('/users', requireAuth, requireRole('admin'), userRouter);
apiRouter.use('/exchange-rates', requireAuth, requireRole('admin'), exchangeRateRouter);


