import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import { fx as fxApi } from '@/lib/fx'
import {
    type ActivityRow,
    type AggregateResult,
    type BudgetAllocationRow,
    type EngineContext,
    type ExpenseRow,
    type GoalContributionRow,
    type GoalRow,
    type IncomeRow,
    monthRange,
    type ObjectRow,
    runEngine,
} from '@/lib/time-engine'

type Settings = {
    userCurrency: string
    hourlyRate: number | null
    amortizeOneTimeMonths?: number | null
    amortizeCapexMonths?: number | null
    impliedSalary?: { enabled: boolean; hoursPerWeek?: number }
}

type UseTimeEngineParams = {
    userId: number | null
    startMonth: string
    endMonth: string
    settings: Settings
}

type ApiPayload<T> = T | { data: T }

const get = async <T,>(url: string): Promise<T> => {
    const res = await apiFetch<ApiPayload<T>>(url)
    //@ts-ignore
    return (res && 'data' in res) ? (res as any).data : (res as T)
}

type BackendBudget = { id: number; period_start: string; period_end: string; currency: string }
type BackendBudgetAllocation = { id: number; budget_id: number; category_id: number; amount_cents: number }
type BackendGoalContribution = { id: number; goal_id: number; contributed_at: string; amount_cents?: number | null; hours?: number | null; source_type?: string }

export function useTimeEngine({ userId, startMonth, endMonth, settings }: UseTimeEngineParams) {
    const months = monthRange(startMonth, endMonth)

    const U = (p: string) => `/api/users/${userId}${p}`

    const key = [
        'time-engine',
        userId ?? 'no-user',
        startMonth,
        endMonth,
        settings.userCurrency,
        settings.hourlyRate,
        settings.amortizeOneTimeMonths ?? 0,
        settings.amortizeCapexMonths ?? 0,
        settings.impliedSalary?.enabled ? (settings.impliedSalary.hoursPerWeek ?? 40) : 0,
    ] as const

    const enabled = !!userId

    const { data, error, isLoading, mutate } = useSWR<AggregateResult>(
        enabled ? key : null,
        async () => {
            const [
                incomes,
                expenses,
                objects,
                activities,
                budgets,
                goals,
            ] = await Promise.all([
                get<IncomeRow[]>(U('/incomes')),
                get<ExpenseRow[]>(U('/expenses')),
                get<ObjectRow[]>(U('/objects')),
                get<ActivityRow[]>(U('/activities')),
                get<BackendBudget[]>(U('/budgets')),
                get<GoalRow[]>(U('/goals')),
            ])

            const budgetAllocations: BudgetAllocationRow[] = (await Promise.all(
                (budgets ?? []).map(async (b) => {
                    const rows = await get<BackendBudgetAllocation[]>(U(`/budgets/${b.id}/allocations`))
                    return rows.map<BudgetAllocationRow>((a) => ({
                        category_id: a.category_id,
                        amount_cents: a.amount_cents,
                        currency: b.currency,
                        period_start: b.period_start,
                        period_end: b.period_end,
                    }))
                })
            )).flat()

            const goalContributions: GoalContributionRow[] = (await Promise.all(
                (goals ?? []).map(async (g) => {
                    const rows = await get<BackendGoalContribution[]>(U(`/goals/${g.id}/contributions`))
                    return rows as GoalContributionRow[]
                })
            )).flat()

            const ctx: EngineContext = {
                userCurrency: settings.userCurrency,
                hourlyRate: settings.hourlyRate,
                fx: (from: string, to: string, date: Date) => fxApi(from, to, date),
                amortizeOneTimeMonths: settings.amortizeOneTimeMonths ?? null,
                amortizeCapexMonths: settings.amortizeCapexMonths ?? null,
                impliedSalary: settings.impliedSalary,
            }

            return await runEngine({
                months,
                ctx,
                incomeRows: incomes ?? [],
                expenseRows: expenses ?? [],
                objectRows: objects ?? [],
                activityRows: activities ?? [],
                budgetAllocations: budgetAllocations.length ? budgetAllocations : undefined,
                goals: (goals ?? []).length ? goals : undefined,
                goalContributions: goalContributions.length ? goalContributions : undefined,
            })
        },
        { revalidateOnFocus: false, shouldRetryOnError: false }
    )

    return { agg: data, months, isLoading: enabled ? isLoading : false, error: enabled ? error : undefined, mutate }
}
