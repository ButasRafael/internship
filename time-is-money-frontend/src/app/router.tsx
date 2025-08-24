import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '@/components/guards/RequireAuth'
import AuthLayout from '@/components/layouts/AuthLayout'
import AppLayout from '@/components/layouts/AppLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Dashboard from '@/pages/dashboard/Dashboard'
import ExpenseCrudPage from "@/pages/expenses/ExpenseCrudPage.tsx";
import CategoryCrudPage from "@/pages/categories/CategoryCrudPage.tsx";
import BudgetCrudPage from '@/pages/budgets/BudgetCrudPage'
import GoalCrudPage from '@/pages/goals/GoalCrudPage'
import IncomeCrudPage from "@/pages/incomes/IncomeCrudPage.tsx";
import ActivityCrudPage from "@/pages/activities/ActivityCrudPage.tsx";
import ObjectCrudPage from "@/pages/objects/ObjectCrudPage.tsx";
import ProfilePage from '@/pages/profile/ProfilePage';
import HourlyRatesPage from '@/pages/profile/HourlyRatesPage';
import BudgetAllocationsPage from "@/pages/budgets/BudgetAllocationsPage.tsx";
import GoalContributionsPage from "@/pages/goals/GoalContributionsPage.tsx";
import ExchangeRatesAdminPage from "@/pages/admin/ExchangeRateAdminPage.tsx";
import UsersAdminPage from "@/pages/admin/UsersAdminPage.tsx";
import NotificationsPage from '@/pages/notifications/NotificationPage';
import ScenarioPage from '@/pages/scenarios/ScenarioPage';
import ScenarioBuilderPage from '@/pages/scenarios/ScenarioBuilderPage';
import EnhancedScenarioBuilderPage from '@/pages/scenarios/EnhancedScenarioBuilderPage';

export const router = createBrowserRouter([
    { element: <AuthLayout />, children: [
            { path: '/login', element: <Login /> },
            { path: '/register', element: <Register /> },
            { path: '/verify-email', element: <VerifyEmail /> },
            { path: '/forgot-password', element: <ForgotPassword /> },
            { path: '/reset-password', element: <ResetPassword /> },
        ]},
    { element: <RequireAuth />, children: [
            { path: '/', element: <AppLayout />, children: [
                    { index: true, element: <Dashboard /> },
                    { path: 'expenses', element: <ExpenseCrudPage /> },
                    { path: 'categories', element: <CategoryCrudPage /> },
                    { path: 'budgets', element: <BudgetCrudPage /> },
                    { path: 'goals', element: <GoalCrudPage /> },
                    { path: 'incomes', element: <IncomeCrudPage /> },
                    { path: 'activities', element: <ActivityCrudPage /> },
                    { path: 'objects',   element: <ObjectCrudPage /> },
                    { path: 'profile', element: <ProfilePage /> },
                    { path: 'profile/rates', element: <HourlyRatesPage /> },
                    { path: 'budgets/:budgetId/allocations', element: <BudgetAllocationsPage /> },
                    { path: 'goals/:goalId/contributions', element: <GoalContributionsPage /> },
                    { path: 'admin/users', element: <UsersAdminPage /> },
                    { path: 'admin/exchange-rates', element: <ExchangeRatesAdminPage /> },
                    { path: 'notifications', element: <NotificationsPage /> },
                    { path: 'scenarios', element: <ScenarioPage /> },
                    { path: 'scenarios/builder', element: <ScenarioBuilderPage /> },
                    { path: 'scenarios/enhanced', element: <EnhancedScenarioBuilderPage /> },


                ]},
        ]},
])
