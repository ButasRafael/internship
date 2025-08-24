import { Request, Response, NextFunction } from 'express'
import { Scenario } from '../models/scenario.model.js'
import { pool } from '../config/db.js'
import dayjs from 'dayjs'
import {
    monthRange,
    runEngine,
    type EngineContext,
    type MonthKey,
    type IncomeRow as EngIncome,
    type ExpenseRow as EngExpense,
    type ObjectRow as EngObject,
    type ActivityRow as EngActivity,
    type BudgetAllocationRow as EngBudgetAlloc,
    type AggregateResult,
} from '../shared/time-engine.js'

export const listScenarios = async (
    req: Request,
    res: Response
): Promise<void> => {
    res.json(await Scenario.findAllByUser(Number(req.params.userId)))
}

export const getScenario = async (
    req: Request,
    res: Response
): Promise<void> => {
    const sc = await Scenario.findById(
        Number(req.params.id),
        Number(req.params.userId)
    )
    if (!sc) {
        res.status(404).json({ error: 'Scenario not found' })
        return
    }
    res.json(sc)
}

export const createScenario = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const sc = await Scenario.create({
            user_id: Number(req.params.userId),
            ...req.body
        })
        res.status(201).json(sc)
    } catch (err) {
        next(err)
    }
}

export const updateScenario = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const sc = await Scenario.update(
            Number(req.params.id),
            Number(req.params.userId),
            req.body
        )
        if (!sc) {
            res.status(404).json({ error: 'Scenario not found' })
            return
        }
        res.json(sc)
    } catch (err) {
        next(err)
    }
}

export const deleteScenario = async (
    req: Request,
    res: Response
): Promise<void> => {
    await Scenario.remove(Number(req.params.id), Number(req.params.userId))
    res.status(204).send()
}

// ---- evaluation helpers ---------------------------------------------------

async function fetchInputs(userId: number) {
    const [incomes, expenses, objects, activities, budgets, allocs, goals, contribs] = await Promise.all([
        pool.execute<any[]>(`SELECT received_at, amount_cents, currency, source, recurring FROM incomes WHERE user_id=?`, [userId]).then(r => r[0] as any[]),
        pool.execute<any[]>(`SELECT amount_cents, currency, frequency, start_date, end_date, is_active, category_id FROM expenses WHERE user_id=?`, [userId]).then(r => r[0] as any[]),
        pool.execute<any[]>(`SELECT id,name,category_id,price_cents,currency,purchase_date,expected_life_months,maintenance_cents_per_month,hours_saved_per_month FROM objects WHERE user_id=?`, [userId]).then(r => r[0] as any[]),
        pool.execute<any[]>(`SELECT id,name,category_id,duration_minutes,frequency,direct_cost_cents,saved_minutes,currency FROM activities WHERE user_id=?`, [userId]).then(r => r[0] as any[]),
        pool.execute<any[]>(`SELECT id, period_start, period_end, currency FROM budgets WHERE user_id=?`, [userId]).then(r => r[0] as any[]),
        pool.execute<any[]>(`SELECT ba.budget_id, ba.category_id, ba.amount_cents FROM budget_allocations ba JOIN budgets b ON b.id=ba.budget_id WHERE b.user_id=?`, [userId]).then(r => r[0] as any[]),
        pool.execute<any[]>(`SELECT id, name, currency, target_amount_cents, target_hours FROM goals WHERE user_id=?`, [userId]).then(r => r[0] as any[]),
        pool.execute<any[]>(
            `SELECT gc.goal_id, gc.contributed_at, gc.amount_cents, gc.hours
             FROM goal_contributions gc
             JOIN goals g ON g.id = gc.goal_id
             WHERE g.user_id=?`,
            [userId]
        ).then(r => r[0] as any[]),
    ])
    const budgetAllocations: EngBudgetAlloc[] = (allocs as any[]).map(a => ({
        category_id: a.category_id,
        amount_cents: a.amount_cents,
        currency: (budgets as any[]).find((b) => b.id === a.budget_id)?.currency ?? 'RON',
        period_start: (budgets as any[]).find((b) => b.id === a.budget_id)?.period_start,
        period_end:   (budgets as any[]).find((b) => b.id === a.budget_id)?.period_end,
    }))
    return { incomes, expenses, objects, activities, budgetAllocations, goals, contribs }
}

async function fx(from: string, to: string, at: Date): Promise<number> {
    const ymd = dayjs(at).format('YYYY-MM-DD')
    from = from.toUpperCase(); to = to.toUpperCase();
    if (from === to) return 1
    const q = `SELECT rate FROM exchange_rates WHERE day<=? AND base=? AND quote='RON' ORDER BY day DESC LIMIT 1`
    if (from === 'RON') {
        const [r2] = await pool.execute<any[]>(q, [ymd, to]);
        const v = (r2[0] as any)?.rate as number | undefined; return v ? 1 / v : 1
    }
    if (to === 'RON') {
        const [r1] = await pool.execute<any[]>(q, [ymd, from]);
        const v = (r1[0] as any)?.rate as number | undefined; return v || 1
    }
    const [rf] = await pool.execute<any[]>(q, [ymd, from]);
    const [rt] = await pool.execute<any[]>(q, [ymd, to]);
    const a = (rf[0] as any)?.rate as number | undefined;
    const b = (rt[0] as any)?.rate as number | undefined;
    return a && b ? a / b : 1
}

async function buildHourlyRateFor(userId: number, months: string[], fallback: number | null, overrides?: Record<string, number>): Promise<(mk: string) => number | null> {
    if (!months.length) return () => fallback
    const maxMonth = months.slice().sort()[months.length - 1]
    const [rows] = await pool.execute<any[]>(
        `SELECT effective_month, hourly_rate FROM user_hourly_rates WHERE user_id=? AND effective_month <= DATE(CONCAT(?, '-01')) ORDER BY effective_month ASC`,
        [userId, maxMonth]
    )
    const effs = (rows as any[]).map(r => ({ ym: dayjs(r.effective_month as any).format('YYYY-MM'), rate: Number(r.hourly_rate) }))
    const sorted = months.slice().sort()
    let i = 0; let last: number | null = fallback != null ? Number(fallback) : null
    const map: Record<string, number | null> = {}
    for (const mk of sorted) {
        while (i < effs.length && effs[i].ym <= mk) { last = effs[i].rate; i++ }
        map[mk] = last
    }
    if (overrides) {
        for (const [k, v] of Object.entries(overrides)) map[k] = Number(v)
    }
    return (mk: string) => map[mk] ?? fallback
}

function diffMonthlySeries(
    months: MonthKey[],
    base?: Record<string, number> | null,
    scenario?: Record<string, number> | null,
): Record<string, number> | null | undefined {
    if (base === undefined && scenario === undefined) return undefined
    if (base === null && scenario === null) return null
    const out: Record<string, number> = {}
    for (const mk of months) {
        const a = base ? Number(base[mk] || 0) : 0
        const b = scenario ? Number(scenario[mk] || 0) : 0
        out[mk] = b - a
    }
    return out
}

function diffCategoryMap(
    months: MonthKey[],
    base?: Record<number, Record<string, number>> | null,
    scenario?: Record<number, Record<string, number>> | null,
): Record<number, Record<string, number>> | null | undefined {
    if (base === undefined && scenario === undefined) return undefined
    if (base === null && scenario === null) return null
    const out: Record<number, Record<string, number>> = {}
    const keys = new Set<number>([
        ...Object.keys(base || {}).map(Number),
        ...Object.keys(scenario || {}).map(Number),
    ])
    for (const k of keys) {
        out[k] = diffMonthlySeries(months, base?.[k] || {}, scenario?.[k] || {}) as Record<string, number>
    }
    return out
}

type OpItem = { op: 'add'|'edit'|'remove'; id?: number; row?: any; patch?: any }
function applyOps<T>(base: any[], ops: OpItem[] | undefined, getId: (r:any)=>number|undefined, map: (r:any)=>T): T[] {
    let rows = base.map(r => ({ ...r }))
    if (!Array.isArray(ops) || !ops.length) return rows.map(map)
    for (const op of ops) {
        if (op.op === 'add' && op.row) {
            rows.push(op.row)
        } else if (op.op === 'edit' && op.id != null && op.patch) {
            rows = rows.map(r => (getId(r) === op.id ? { ...r, ...op.patch } : r))
        } else if (op.op === 'remove' && op.id != null) {
            rows = rows.filter(r => getId(r) !== op.id)
        }
    }
    return rows.map(map)
}

// POST /api/users/:userId/scenarios/:id/evaluate?from&to
export const evaluateScenario = async (req: Request, res: Response): Promise<void> => {
    const userId = Number(req.params.userId)
    const id = Number(req.params.id)
    const from = (req.query.from as string) || dayjs().subtract(5, 'month').format('YYYY-MM')
    const to   = (req.query.to   as string) || dayjs().format('YYYY-MM')
    const months: MonthKey[] = monthRange(from, to)

    const sc = await Scenario.findById(id, userId)
    if (!sc) { res.status(404).json({ error: 'Scenario not found' }); return }
    const params = (sc.params_json || {}) as any

    const userRow = await pool.execute<any[]>(`SELECT currency, hourly_rate FROM users WHERE id=?`, [userId]).then(r => (r[0] as any[])[0])
    const baseCtx: EngineContext = {
        userCurrency: userRow?.currency || 'RON',
        hourlyRate: userRow?.hourly_rate != null ? Number(userRow.hourly_rate) : null,
        fx,
        amortizeOneTimeMonths: params?.engine?.amortizeOneTimeMonths ?? 0,
        amortizeCapexMonths: params?.engine?.amortizeCapexMonths ?? 12,
        impliedSalary: params?.engine?.impliedSalary ?? { enabled: false },
    }

    const { incomes, expenses, objects, activities, budgetAllocations, goals, contribs } = await fetchInputs(userId)

    // Baseline aggregate (no overrides, no additions)
    const hrForBase = await buildHourlyRateFor(userId, months as string[], baseCtx.hourlyRate ?? null)
    const ctxBase: EngineContext = { ...baseCtx, hourlyRateFor: hrForBase }
    const baseline = await runEngine({
        months,
        ctx: ctxBase,
        incomeRows: incomes as EngIncome[],
        expenseRows: expenses as EngExpense[],
        objectRows: objects as EngObject[],
        activityRows: activities as EngActivity[],
        budgetAllocations: (budgetAllocations as EngBudgetAlloc[]),
        goals: goals as any,
        goalContributions: contribs as any,
    })

    // Scenario aggregate (apply overrides, ops, scaling, budgets override)
    const overrides: Record<string, number> | undefined = params?.hourlyRates as any
    const hrFor = await buildHourlyRateFor(userId, months as string[], baseCtx.hourlyRate ?? null, overrides)
    const ctx: EngineContext = { ...baseCtx, hourlyRateFor: hrFor }

    const incRows: EngIncome[] = applyOps(incomes as any[], params?.incomes_ops, (r:any)=>r.id, (r:any)=>({
        received_at: r.received_at, amount_cents: r.amount_cents, currency: r.currency, source: r.source, recurring: r.recurring,
    })) as EngIncome[]
    const expBase: any[] = applyOps(expenses as any[], params?.expenses_ops, (r:any)=>r.id, (r:any)=>({
        amount_cents: r.amount_cents, currency: r.currency, frequency: r.frequency, start_date: r.start_date, end_date: r.end_date, is_active: r.is_active, category_id: r.category_id,
    }))
    let expRows: EngExpense[] = expBase as EngExpense[]
    const objRows: EngObject[]  = applyOps(objects as any[], params?.objects_ops, (r:any)=>r.id, (r:any)=>({
        id: r.id, name: r.name, category_id: r.category_id, price_cents: r.price_cents, currency: r.currency, purchase_date: r.purchase_date, expected_life_months: r.expected_life_months, maintenance_cents_per_month: r.maintenance_cents_per_month, hours_saved_per_month: r.hours_saved_per_month,
    })) as EngObject[]
    const actRows: EngActivity[] = applyOps(activities as any[], params?.activities_ops, (r:any)=>r.id, (r:any)=>({
        id: r.id, name: r.name, category_id: r.category_id, duration_minutes: r.duration_minutes, frequency: r.frequency, direct_cost_cents: r.direct_cost_cents, saved_minutes: r.saved_minutes, currency: r.currency,
    })) as EngActivity[]

    if (params?.incomes_add) incRows.push(...(params.incomes_add as EngIncome[]))
    if (params?.expenses_add) expRows.push(...(params.expenses_add as EngExpense[]))
    if (params?.objects_add) objRows.push(...(params.objects_add as EngObject[]))
    if (params?.activities_add) actRows.push(...(params.activities_add as EngActivity[]))

    const scales: any[] = Array.isArray(params?.scaleByCategory) ? params.scaleByCategory : []
    for (const s of scales) {
        const factor = Number(s.factor)
        if (!Number.isFinite(factor) || factor <= 0) continue
        if (s.kind === 'expense') {
            expRows = expRows.map((e:any) => (e.category_id === s.category_id ? { ...e, amount_cents: Math.round(Number(e.amount_cents||0) * factor) } : e))
        } else if (s.kind === 'activity') {
            for (let i=0;i<actRows.length;i++) if ((actRows[i] as any).category_id === s.category_id) (actRows[i] as any).direct_cost_cents = Math.round(Number((actRows[i] as any).direct_cost_cents||0) * factor)
        } else if (s.kind === 'object') {
            for (let i=0;i<objRows.length;i++) if ((objRows[i] as any).category_id === s.category_id) (objRows[i] as any).maintenance_cents_per_month = Math.round(Number((objRows[i] as any).maintenance_cents_per_month||0) * factor)
        }
    }

    let budgAllocs: EngBudgetAlloc[] = [...(budgetAllocations as EngBudgetAlloc[])]
    if (Array.isArray(params?.budgets_override) && params.budgets_override.length) {
        budgAllocs = []
        for (const b of params.budgets_override as any[]) {
            const currency = b.currency || 'RON'
            for (const a of (b.allocations || [])) {
                budgAllocs.push({ category_id: Number(a.category_id), amount_cents: Number(a.amount_cents)||0, currency, period_start: b.period_start, period_end: b.period_end })
            }
        }
    }

    const scenario = await runEngine({
        months,
        ctx,
        incomeRows: incRows,
        expenseRows: expRows,
        objectRows: objRows,
        activityRows: actRows,
        budgetAllocations: budgAllocs,
        goals: goals as any,
        goalContributions: contribs as any,
    })

    const diff = buildDiff(months, baseline, scenario)
    res.json({ months, baseline, scenario, diff })
}

// POST /api/users/:userId/scenarios/preview  body: { params_json, from, to }
export const previewScenario = async (req: Request, res: Response): Promise<void> => {
    const userId = Number(req.params.userId)
    const body = (req.body || {}) as any
    const from = (body.from as string) || dayjs().subtract(5, 'month').format('YYYY-MM')
    const to   = (body.to   as string) || dayjs().format('YYYY-MM')
    const months: MonthKey[] = monthRange(from, to)

    const params = (body.params_json || {}) as any
    const userRow = await pool.execute<any[]>(`SELECT currency, hourly_rate FROM users WHERE id=?`, [userId]).then(r => (r[0] as any[])[0])
    const baseCtx: EngineContext = {
        userCurrency: userRow?.currency || 'RON',
        hourlyRate: userRow?.hourly_rate != null ? Number(userRow.hourly_rate) : null,
        fx,
        amortizeOneTimeMonths: params?.engine?.amortizeOneTimeMonths ?? 0,
        amortizeCapexMonths: params?.engine?.amortizeCapexMonths ?? 12,
        impliedSalary: params?.engine?.impliedSalary ?? { enabled: false },
    }
    const { incomes, expenses, objects, activities, budgetAllocations, goals, contribs } = await fetchInputs(userId)

    // Baseline
    const hrForBase = await buildHourlyRateFor(userId, months as string[], baseCtx.hourlyRate ?? null)
    const ctxBase: EngineContext = { ...baseCtx, hourlyRateFor: hrForBase }
    const baseline = await runEngine({ months, ctx: ctxBase, incomeRows: incomes as EngIncome[], expenseRows: expenses as EngExpense[], objectRows: objects as EngObject[], activityRows: activities as EngActivity[], budgetAllocations: budgetAllocations as EngBudgetAlloc[], goals: goals as any, goalContributions: contribs as any })

    // Scenario
    const overrides: Record<string, number> | undefined = params?.hourlyRates as any
    const hrFor = await buildHourlyRateFor(userId, months as string[], baseCtx.hourlyRate ?? null, overrides)
    const ctx: EngineContext = { ...baseCtx, hourlyRateFor: hrFor }

    const incRows: EngIncome[] = applyOps(incomes as any[], params?.incomes_ops, (r:any)=>r.id, (r:any)=>({ received_at: r.received_at, amount_cents: r.amount_cents, currency: r.currency, source: r.source, recurring: r.recurring })) as EngIncome[]
    const expBase: any[] = applyOps(expenses as any[], params?.expenses_ops, (r:any)=>r.id, (r:any)=>({ amount_cents: r.amount_cents, currency: r.currency, frequency: r.frequency, start_date: r.start_date, end_date: r.end_date, is_active: r.is_active, category_id: r.category_id }))
    let expRows: EngExpense[] = expBase as EngExpense[]
    const objRows: EngObject[]  = applyOps(objects as any[], params?.objects_ops, (r:any)=>r.id, (r:any)=>({ id: r.id, name: r.name, category_id: r.category_id, price_cents: r.price_cents, currency: r.currency, purchase_date: r.purchase_date, expected_life_months: r.expected_life_months, maintenance_cents_per_month: r.maintenance_cents_per_month, hours_saved_per_month: r.hours_saved_per_month })) as EngObject[]
    const actRows: EngActivity[] = applyOps(activities as any[], params?.activities_ops, (r:any)=>r.id, (r:any)=>({ id: r.id, name: r.name, category_id: r.category_id, duration_minutes: r.duration_minutes, frequency: r.frequency, direct_cost_cents: r.direct_cost_cents, saved_minutes: r.saved_minutes, currency: r.currency })) as EngActivity[]

    if (params?.incomes_add) incRows.push(...(params.incomes_add as EngIncome[]))
    if (params?.expenses_add) expRows.push(...(params.expenses_add as EngExpense[]))
    if (params?.objects_add) objRows.push(...(params.objects_add as EngObject[]))
    if (params?.activities_add) actRows.push(...(params.activities_add as EngActivity[]))

    const scales: any[] = Array.isArray(params?.scaleByCategory) ? params.scaleByCategory : []
    for (const s of scales) {
        const factor = Number(s.factor)
        if (!Number.isFinite(factor) || factor <= 0) continue
        if (s.kind === 'expense') {
            expRows = expRows.map((e:any) => (e.category_id === s.category_id ? { ...e, amount_cents: Math.round(Number(e.amount_cents||0) * factor) } : e))
        } else if (s.kind === 'activity') {
            for (let i=0;i<actRows.length;i++) if ((actRows[i] as any).category_id === s.category_id) (actRows[i] as any).direct_cost_cents = Math.round(Number((actRows[i] as any).direct_cost_cents||0) * factor)
        } else if (s.kind === 'object') {
            for (let i=0;i<objRows.length;i++) if ((objRows[i] as any).category_id === s.category_id) (objRows[i] as any).maintenance_cents_per_month = Math.round(Number((objRows[i] as any).maintenance_cents_per_month||0) * factor)
        }
    }

    let budgAllocs: EngBudgetAlloc[] = [...(budgetAllocations as EngBudgetAlloc[])]
    if (Array.isArray(params?.budgets_override) && params.budgets_override.length) {
        budgAllocs = []
        for (const b of params.budgets_override as any[]) {
            const currency = b.currency || 'RON'
            for (const a of (b.allocations || [])) {
                budgAllocs.push({ category_id: Number(a.category_id), amount_cents: Number(a.amount_cents)||0, currency, period_start: b.period_start, period_end: b.period_end })
            }
        }
    }

    const scenario = await runEngine({ months, ctx, incomeRows: incRows, expenseRows: expRows, objectRows: objRows, activityRows: actRows, budgetAllocations: budgAllocs, goals: goals as any, goalContributions: contribs as any })

    const diff = buildDiff(months, baseline, scenario)
    res.json({ months, baseline, scenario, diff })
}

function buildDiff(months: MonthKey[], base: AggregateResult, sc: AggregateResult) {
    return {
        incomeMoney: diffMonthlySeries(months, base.incomeMoney, sc.incomeMoney)!,
        incomeHours: diffMonthlySeries(months, base.incomeHours || null, sc.incomeHours || null) ?? null,
        expenseMoney: diffMonthlySeries(months, base.expenseMoney, sc.expenseMoney)!,
        expenseHours: diffMonthlySeries(months, base.expenseHours || null, sc.expenseHours || null) ?? null,
        objectsMaintHours: diffMonthlySeries(months, base.objectsMaintHours || null, sc.objectsMaintHours || null) ?? null,
        objectsSavedHours: diffMonthlySeries(months, base.objectsSavedHours, sc.objectsSavedHours)!,
        objectsCapexHours: diffMonthlySeries(months, base.objectsCapexHours || null, sc.objectsCapexHours || null) ?? null,
        activitiesSavedHours: diffMonthlySeries(months, base.activitiesSavedHours, sc.activitiesSavedHours)!,
        activitiesExtraCostHours: diffMonthlySeries(months, base.activitiesExtraCostHours, sc.activitiesExtraCostHours)!,
        budgetMoney: (base.budgetMoney === undefined && sc.budgetMoney === undefined)
            ? undefined
            : diffMonthlySeries(months, base.budgetMoney || {}, sc.budgetMoney || {}),
        budgetHours: diffMonthlySeries(months, base.budgetHours || null, sc.budgetHours || null) ?? null,
        budgetVarianceHoursByMonth: diffMonthlySeries(months, base.budgetVarianceHoursByMonth || null, sc.budgetVarianceHoursByMonth || null) ?? null,
        costByCategoryHours: diffCategoryMap(months, base.costByCategoryHours || undefined, sc.costByCategoryHours || undefined) ?? undefined,
        savingsByCategoryHours: diffCategoryMap(months, base.savingsByCategoryHours || undefined, sc.savingsByCategoryHours || undefined) ?? undefined,
        timeCostHours: diffMonthlySeries(months, base.timeCostHours || null, sc.timeCostHours || null) ?? null,
        timeSavingsHours: diffMonthlySeries(months, base.timeSavingsHours || null, sc.timeSavingsHours || null) ?? null,
        timeBurnNet: diffMonthlySeries(months, base.timeBurnNet || null, sc.timeBurnNet || null) ?? null,
        netSavingsHoursPerMonthDelta: (sc.netSavingsHoursPerMonth ?? 0) - (base.netSavingsHoursPerMonth ?? 0),
    }
}
