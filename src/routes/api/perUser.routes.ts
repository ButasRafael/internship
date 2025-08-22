import { Router } from 'express'

import { expenseRouter }            from '../expense.routes.js'
import { activityRouter }           from '../activity.routes.js'
import { categoryRouter }           from '../category.routes.js'
import { objectRouter }             from '../object.routes.js'
import { budgetRouter }             from '../budget.routes.js'
import { budgetAllocationRouter }   from '../budgetAllocation.routes.js'
import { goalRouter }               from '../goal.routes.js'
import { goalContributionRouter }   from '../goalContribution.routes.js'
import { alertRouter }              from '../alert.routes.js'
import { notificationRouter }       from '../notification.routes.js'
import { scenarioRouter }           from '../scenario.routes.js'
import { incomeRouter }             from '../income.router.js'
import { userNotificationsRouter } from '../userNotifications.routes.js';

export const perUserRouter = Router({ mergeParams: true })

perUserRouter.use('/expenses',                     expenseRouter)
perUserRouter.use('/activities',                   activityRouter)
perUserRouter.use('/categories',                   categoryRouter)
perUserRouter.use('/objects',                      objectRouter)
perUserRouter.use('/budgets',                      budgetRouter)
perUserRouter.use('/budgets/:budgetId/allocations', budgetAllocationRouter)
perUserRouter.use('/goals',                        goalRouter)
perUserRouter.use('/goals/:goalId/contributions',  goalContributionRouter)
perUserRouter.use('/alerts',                       alertRouter)
perUserRouter.use('/alerts/:alertId/notifications', notificationRouter)
perUserRouter.use('/scenarios',                    scenarioRouter)
perUserRouter.use('/incomes',                      incomeRouter)
perUserRouter.use('/notifications', userNotificationsRouter)
