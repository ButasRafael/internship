import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireSelfOrPermission } from '../../middlewares/permission.js';

import { userRouter } from '../user.routes.js';
import { exchangeRateRouter } from '../exchangeRate.routes.js';
import { perUserRouter } from './perUser.routes.js';

export const apiRouter = Router();

apiRouter.use(
    '/users/:userId',
    requireAuth,
    requireSelfOrPermission('userId', 'user_manage'),
    perUserRouter
);

apiRouter.use('/users', requireAuth, userRouter);
apiRouter.use('/exchange-rates', requireAuth, exchangeRateRouter);
