import dayjs from 'dayjs'

export type MonthKey = `${number}-${number}` | string
export type Frequency = 'once' | 'weekly' | 'monthly' | 'yearly'
export type IncomeRecurring = 'none' | Frequency

export interface EngineContext {
    userCurrency: string
    hourlyRate: number | null
    /** Optional per-month hourly rate resolver (YYYY-MM). Overrides hourlyRate when present. */
    hourlyRateFor?: (mk: MonthKey) => number | null
    fx: (from: string, to: string, date: Date) => Promise<number>
    amortizeOneTimeMonths?: number | null
    amortizeCapexMonths?: number | null
    impliedSalary?: { enabled: boolean; hoursPerWeek?: number }
}

export const EPS = 1e-6

export function toMonthKey(d: Date | dayjs.Dayjs | string): MonthKey {
    const m = dayjs(d)
    return m.format('YYYY-MM')
}
export function monthStart(mk: MonthKey): dayjs.Dayjs {
    return dayjs(mk + '-01').startOf('month')
}
export function monthEnd(mk: MonthKey): dayjs.Dayjs {
    return dayjs(mk + '-01').endOf('month')
}
export function monthRange(from: MonthKey, to: MonthKey): MonthKey[] {
    const start = monthStart(from)
    const end = monthStart(to)
    const out: MonthKey[] = []
    let cur = start
    while (!cur.isAfter(end)) {
        out.push(cur.format('YYYY-MM'))
        cur = cur.add(1, 'month')
    }
    return out
}

export function freqToMonthly(f: Frequency): number {
    switch (f) {
        case 'weekly':  return 52.1429 / 12
        case 'monthly': return 1
        case 'yearly':  return 1 / 12
        case 'once':    return 0
        default:        return 0
    }
}
const _fxCache = new Map<string, number>()

export async function moneyToUser(
    amountCents: number,
    fromCurrency: string,
    onDate: Date,
    ctx: EngineContext
): Promise<number> {
    const amt = (amountCents || 0) / 100
    const from = (fromCurrency || '').toUpperCase()
    const to = (ctx.userCurrency || '').toUpperCase()
    if (!from || from === to) return amt

    const ym = dayjs(onDate).format('YYYY-MM')
    const k = `${from}|${to}|${ym}`

    try {
        let rate = _fxCache.get(k)
        if (rate == null) {
            rate = await ctx.fx(from, to, onDate)
            if (!rate || !isFinite(rate) || rate <= 0) rate = 1
            _fxCache.set(k, rate)
        }
        return amt * rate
    } catch {
        return amt
    }
}


export function moneyToHours(amountUserCurrency: number, ctx: EngineContext): number | null {
    if (!ctx.hourlyRate || ctx.hourlyRate <= 0) return null
    return amountUserCurrency / ctx.hourlyRate
}

export function moneyToHoursForMonth(amountUserCurrency: number, mk: MonthKey, ctx: EngineContext): number | null {
    const r = ctx.hourlyRateFor ? ctx.hourlyRateFor(mk) : ctx.hourlyRate
    if (!r || r <= 0) return null
    return amountUserCurrency / r
}

function ensureCatSeries(
    map: Record<number, MonthlySeries>,
    categoryId: number,
    months: MonthKey[],
): MonthlySeries {
    if (!(categoryId in map)) {
        map[categoryId] = months.reduce((acc, mk) => ((acc[mk] = 0), acc), {} as MonthlySeries)
    }
    return map[categoryId]
}


export interface IncomeRow {
    received_at: string
    amount_cents: number
    currency: string
    source: string
    recurring: IncomeRecurring
}

export interface MonthlySeries { [month: string]: number }

export interface IncomeResult {
    moneyByMonth: MonthlySeries
    hoursByMonth: MonthlySeries | null
    bySourceMoney?: Record<string, MonthlySeries>
}

export async function computeIncomeByMonth(
    rows: IncomeRow[], months: MonthKey[], ctx: EngineContext
): Promise<IncomeResult> {
    const money: MonthlySeries = {}
    const hours: MonthlySeries | null = ctx.hourlyRate && ctx.hourlyRate > 0 ? {} : null
    const bySource: Record<string, MonthlySeries> = {}
    for (const mk of months) { money[mk] = 0; if (hours) hours[mk] = 0 }

    for (const r of rows) {
        const rec = r.recurring || 'none'
        if (rec === 'none') {
            const mk = toMonthKey(r.received_at)
            if (!(mk in money)) continue
            const amtUser = await moneyToUser(r.amount_cents, r.currency, dayjs(r.received_at).toDate(), ctx)
            money[mk] += amtUser
            if (hours) hours[mk] += moneyToHoursForMonth(amtUser, mk, ctx) ?? 0
            bySource[r.source] ||= {}; bySource[r.source][mk] = (bySource[r.source][mk] || 0) + amtUser
        } else {
            const k = freqToMonthly(rec as Frequency)
            for (const mk of months) {
                const amtUser = await moneyToUser(r.amount_cents, r.currency, monthStart(mk).toDate(), ctx)
                const m = amtUser * k
                money[mk] += m
                if (hours) hours[mk] += moneyToHoursForMonth(m, mk, ctx) ?? 0
                bySource[r.source] ||= {}; bySource[r.source][mk] = (bySource[r.source][mk] || 0) + m
            }
        }
    }

    if (ctx.impliedSalary?.enabled && ctx.hourlyRate && ctx.hourlyRate > 0) {
        const hpw = Math.max(0, ctx.impliedSalary.hoursPerWeek ?? 40)
        const monthlyMoney = ctx.hourlyRate * hpw * (52.1429 / 12)
        for (const mk of months) {
            money[mk] += monthlyMoney
            if (hours) hours[mk] += monthlyMoney / ctx.hourlyRate
        }
    }
    return { moneyByMonth: money, hoursByMonth: hours, bySourceMoney: bySource }
}


export interface ExpenseRow {
    amount_cents: number
    currency: string
    frequency: Frequency
    start_date: string
    end_date: string | null
    is_active?: 0 | 1
    category_id?: number | null
}

export interface ExpenseResult {
    moneyByMonth: MonthlySeries
    hoursByMonth: MonthlySeries | null
    byCategoryMoney?: Record<number, MonthlySeries>
    byCategoryHours?: Record<number, MonthlySeries> | null
}


export async function computeExpensesByMonth(
    rows: ExpenseRow[], months: MonthKey[], ctx: EngineContext
): Promise<ExpenseResult> {
    const money: MonthlySeries = {}
    const hours: MonthlySeries | null = ctx.hourlyRate && ctx.hourlyRate > 0 ? {} : null
    for (const mk of months) { money[mk] = 0; if (hours) hours[mk] = 0 }

    const byCatMoney: Record<number, MonthlySeries> = {}
    const byCatHours: Record<number, MonthlySeries> | null = hours ? {} : null

    const amortN = (ctx.amortizeOneTimeMonths ?? 0) > 0 ? (ctx.amortizeOneTimeMonths as number) : 0

    for (const r of rows) {
        const active = r.is_active != null ? r.is_active === 1 : true
        if (!active) continue
        const catId = (r.category_id ?? undefined) as number | undefined

        if (r.frequency === 'once') {
            const startMk = toMonthKey(r.start_date)
            const amtUser = await moneyToUser(r.amount_cents, r.currency, dayjs(r.start_date).toDate(), ctx)

            if (amortN > 0) {
                for (let i = 0; i < amortN; i++) {
                    const mk = dayjs(startMk + '-01').add(i, 'month').format('YYYY-MM')
                    if (!(mk in money)) continue
                    const portion = amtUser / amortN
                    money[mk] += portion
                    if (hours) hours[mk] += moneyToHoursForMonth(portion, mk, ctx) ?? 0

                    if (catId != null) {
                        const cm = ensureCatSeries(byCatMoney, catId, months)
                        cm[mk] += portion
                        if (byCatHours) {
                            const ch = ensureCatSeries(byCatHours, catId, months)
                            ch[mk] += moneyToHoursForMonth(portion, mk, ctx) ?? 0
                        }
                    }
                }
            } else if (startMk in money) {
                money[startMk] += amtUser
                if (hours) hours[startMk] += moneyToHoursForMonth(amtUser, startMk, ctx) ?? 0

                if (catId != null) {
                    const cm = ensureCatSeries(byCatMoney, catId, months)
                    cm[startMk] += amtUser
                    if (byCatHours) {
                        const ch = ensureCatSeries(byCatHours, catId, months)
                        ch[startMk] += moneyToHoursForMonth(amtUser, startMk, ctx) ?? 0
                    }
                }
            }
        } else {
            const k = freqToMonthly(r.frequency)
            for (const mk of months) {
                const inRange =
                    !dayjs(r.start_date).isAfter(monthEnd(mk)) &&
                    (!r.end_date || !monthStart(mk).isAfter(dayjs(r.end_date)))
                if (!inRange) continue

                const amtUser = await moneyToUser(r.amount_cents, r.currency, monthStart(mk).toDate(), ctx)
                const m = amtUser * k
                money[mk] += m
                if (hours) hours[mk] += moneyToHoursForMonth(m, mk, ctx) ?? 0

                if (catId != null) {
                    const cm = ensureCatSeries(byCatMoney, catId, months)
                    cm[mk] += m
                    if (byCatHours) {
                        const ch = ensureCatSeries(byCatHours, catId, months)
                        ch[mk] += moneyToHoursForMonth(m, mk, ctx) ?? 0
                    }
                }
            }
        }
    }

    return { moneyByMonth: money, hoursByMonth: hours, byCategoryMoney: byCatMoney, byCategoryHours: byCatHours }
}

export interface ObjectRow {
    id?: number
    name?: string
    price_cents: number
    currency: string
    purchase_date: string
    expected_life_months: number
    maintenance_cents_per_month: number
    hours_saved_per_month: number
    category_id?: number | null
}

export interface ObjectStaticMetrics {
    id?: number
    name?: string
    capex_hours: number | null
    maint_hours_per_month: number | null
    saved_hours_per_month: number
    net_hours_per_month: number | null
    payback_months: number | null
    lifetime_roi_hours: number | null
}

export interface ObjectsResult {
    maintHoursByMonth: MonthlySeries | null
    savedHoursByMonth: MonthlySeries
    capexHoursAmortizedByMonth?: MonthlySeries | null
    metrics: ObjectStaticMetrics[]
    byCategoryMaintHours?: Record<number, MonthlySeries> | null
    byCategorySavedHours?: Record<number, MonthlySeries>
    byCategoryCapexHours?: Record<number, MonthlySeries> | null
}

export async function computeObjects(
    rows: ObjectRow[],
    months: MonthKey[],
    ctx: EngineContext
): Promise<ObjectsResult> {
    const maintHours: MonthlySeries | null =
        ctx.hourlyRate && ctx.hourlyRate > 0 ? {} : null;
    const savedHours: MonthlySeries = {};
    const capexAmort: MonthlySeries | null =
        ctx.hourlyRate && ctx.hourlyRate > 0 && (ctx.amortizeCapexMonths ?? 0) > 0
            ? {}
            : null;

    for (const mk of months) {
        if (maintHours) maintHours[mk] = 0;
        savedHours[mk] = 0;
        if (capexAmort) capexAmort[mk] = 0;
    }

    const metrics: ObjectStaticMetrics[] = [];
    const capexN =
        (ctx.amortizeCapexMonths ?? 0) > 0 ? (ctx.amortizeCapexMonths as number) : 0;

    const byCatMaint: Record<number, MonthlySeries> | null = maintHours ? {} : null;
    const byCatSaved: Record<number, MonthlySeries> = {};
    const byCatCapex: Record<number, MonthlySeries> | null = capexAmort ? {} : null;

    for (const o of rows) {
        const catId = (o.category_id ?? undefined) as number | undefined;

        const capexUser = await moneyToUser(num(o.price_cents), o.currency, dayjs(o.purchase_date).toDate(), ctx)
        const capexHours = moneyToHours(capexUser, ctx);

        const maintHoursPerMoStatic = moneyToHours(
            await moneyToUser(
                o.maintenance_cents_per_month,
                o.currency,
                dayjs(o.purchase_date).toDate(),
                ctx
            ),
            ctx
        );

        const savedH = num(o.hours_saved_per_month)
        const netHStatic =
            maintHoursPerMoStatic != null ? savedH - maintHoursPerMoStatic : null;

        let payback: number | null = null;
        let lifetimeRoi: number | null = null;
        if (capexHours != null) {
            if (netHStatic != null && netHStatic > EPS) payback = capexHours / netHStatic;
            if (netHStatic != null)
                lifetimeRoi = netHStatic * o.expected_life_months - capexHours;
        }

        metrics.push({
            id: o.id,
            name: o.name,
            capex_hours: capexHours,
            maint_hours_per_month: maintHoursPerMoStatic,
            saved_hours_per_month: savedH,
            net_hours_per_month: netHStatic,
            payback_months: payback,
            lifetime_roi_hours: lifetimeRoi,
        });

        const startLife = monthStart(toMonthKey(o.purchase_date));
        const endLife = startLife.add(
            Math.max(0, o.expected_life_months - 1),
            'month'
        );

        for (const mk of months) {
            const mkStart = monthStart(mk);
            const inLife =
                !mkStart.isBefore(startLife) && !mkStart.isAfter(endLife);
            if (!inLife) continue;

            const maintUserThisMonth = await moneyToUser(
                o.maintenance_cents_per_month,
                o.currency,
                mkStart.toDate(),
                ctx
            );
            const maintHThisMonth = moneyToHoursForMonth(maintUserThisMonth, mk, ctx) ?? 0;

            if (maintHours) {
                maintHours[mk] += maintHThisMonth;
                if (catId != null && byCatMaint) {
                    ensureCatSeries(byCatMaint, catId, months)[mk] += maintHThisMonth;
                }
            }

            savedHours[mk] += savedH;
            if (catId != null) {
                ensureCatSeries(byCatSaved, catId, months)[mk] += savedH;
            }
        }

        if (capexAmort && capexN > 0) {
            const startMk = toMonthKey(o.purchase_date);
            const totalUserMoney = capexUser;
            for (let i = 0; i < capexN; i++) {
                const mk = dayjs(startMk + '-01').add(i, 'month').format('YYYY-MM');
                if (!(mk in capexAmort)) continue;
                const portionMoney = totalUserMoney / capexN;
                const portionHours = moneyToHoursForMonth(portionMoney, mk, ctx) ?? 0;
                capexAmort[mk] += portionHours;
                if (catId != null && byCatCapex) {
                    ensureCatSeries(byCatCapex, catId, months)[mk] += portionHours;
                }
            }
        }
    }

    return {
        maintHoursByMonth: maintHours,
        savedHoursByMonth: savedHours,
        capexHoursAmortizedByMonth: capexAmort,
        metrics,
        byCategoryMaintHours: byCatMaint,
        byCategorySavedHours: byCatSaved,
        byCategoryCapexHours: byCatCapex,
    };
}

export interface ActivityRow {
    id?: number
    name?: string
    duration_minutes: number
    frequency: Frequency
    direct_cost_cents: number
    saved_minutes: number
    currency: string
    category_id?: number | null
}

export interface ActivitiesResult {
    savedHoursByMonth: MonthlySeries
    extraCostHoursByMonth: MonthlySeries
    netHoursByMonth: MonthlySeries
    roiByActivity?: { id?: number; name?: string; roi_ratio: number | null; net_hours_per_occurrence: number | null }[]
    byCategorySavedHours?: Record<number, MonthlySeries>
    byCategoryExtraCostHours?: Record<number, MonthlySeries>
    byCategoryNetHours?: Record<number, MonthlySeries>
}

export async function computeActivities(
    rows: ActivityRow[],
    months: MonthKey[],
    ctx: EngineContext
): Promise<ActivitiesResult> {
    const saved: MonthlySeries = {}, extra: MonthlySeries = {}, net: MonthlySeries = {}
    const perAct: ActivitiesResult['roiByActivity'] = []
    for (const mk of months) { saved[mk] = 0; extra[mk] = 0; net[mk] = 0 }

    const byCatSaved: Record<number, MonthlySeries> = {}
    const byCatExtra: Record<number, MonthlySeries> = {}
    const byCatNet:   Record<number, MonthlySeries> = {}
    
    const onceMonth: MonthKey = toMonthKey(new Date())

    for (const a of rows) {
        const catId = (a.category_id ?? undefined) as number | undefined
        const timeCostOcc = num(a.duration_minutes) / 60
        const benefitOcc  = num(a.saved_minutes) / 60

        const moneyCostUserOccSnap = await moneyToUser(num(a.direct_cost_cents) || 0, a.currency, new Date(), ctx)
        const moneyCostHoursOccSnap  = moneyToHours(moneyCostUserOccSnap, ctx)
        const totalCostOccSnap       = moneyCostHoursOccSnap != null ? timeCostOcc + moneyCostHoursOccSnap : null
        const netOccSnap             = totalCostOccSnap != null ? benefitOcc - totalCostOccSnap : null
        let roi: number | null = null
        if (totalCostOccSnap != null && totalCostOccSnap > EPS) roi = benefitOcc / totalCostOccSnap
        perAct.push({ id: a.id, name: a.name, roi_ratio: roi, net_hours_per_occurrence: netOccSnap })

        if (a.frequency === 'once') {
            if (months.includes(onceMonth)) {
                const mkStart = monthStart(onceMonth).toDate()
                const moneyCostUserOcc  = await moneyToUser(a.direct_cost_cents || 0, a.currency, mkStart, ctx)
                const moneyCostHoursOcc = moneyToHoursForMonth(moneyCostUserOcc, onceMonth, ctx)
                const totalCostOcc      = moneyCostHoursOcc != null ? timeCostOcc + moneyCostHoursOcc : null

                const monthlySaved = Math.max(0, benefitOcc)
                const monthlyExtra = Math.max(0, (totalCostOcc ?? 0) - benefitOcc)
                const monthlyNet   = (totalCostOcc == null) ? benefitOcc : (benefitOcc - totalCostOcc)

                saved[onceMonth] += monthlySaved
                extra[onceMonth] += monthlyExtra
                net[onceMonth]   += monthlyNet

                if (catId != null) {
                    ensureCatSeries(byCatSaved, catId, months)[onceMonth] += monthlySaved
                    ensureCatSeries(byCatExtra, catId, months)[onceMonth] += monthlyExtra
                    ensureCatSeries(byCatNet,   catId, months)[onceMonth] += monthlyNet
                }
            }
            continue;
        }

        const k = freqToMonthly(a.frequency)
        for (const mk of months) {
            const mkStart = monthStart(mk).toDate()

            const moneyCostUserOccThisMonth  = await moneyToUser(a.direct_cost_cents || 0, a.currency, mkStart, ctx)
            const moneyCostHoursOccThisMonth = moneyToHoursForMonth(moneyCostUserOccThisMonth, mk, ctx)
            const totalCostOccThisMonth      = moneyCostHoursOccThisMonth != null ? timeCostOcc + moneyCostHoursOccThisMonth : null

            if (totalCostOccThisMonth == null) {
                const s = Math.max(0, benefitOcc * k)
                saved[mk] += s
                if (catId != null) (ensureCatSeries(byCatSaved, catId, months)[mk] += s)
                continue
            }

            const netOccThisMonth = benefitOcc - totalCostOccThisMonth
            const monthlyNet   = netOccThisMonth * k
            const monthlySaved = Math.max(0, benefitOcc * k)
            const monthlyExtra = Math.max(0, (totalCostOccThisMonth - benefitOcc) * k)

            saved[mk] += monthlySaved
            extra[mk] += monthlyExtra
            net[mk]   += monthlyNet

            if (catId != null) {
                ensureCatSeries(byCatSaved, catId, months)[mk] += monthlySaved
                ensureCatSeries(byCatExtra, catId, months)[mk] += monthlyExtra
                ensureCatSeries(byCatNet,   catId, months)[mk] += monthlyNet
            }
        }
    }

    return {
        savedHoursByMonth: saved,
        extraCostHoursByMonth: extra,
        netHoursByMonth: net,
        roiByActivity: perAct,
        byCategorySavedHours: byCatSaved,
        byCategoryExtraCostHours: byCatExtra,
        byCategoryNetHours: byCatNet,
    }
}



export interface BudgetAllocationRow {
    category_id: number
    amount_cents: number
    currency: string
    period_start: string
    period_end: string
}

export interface BudgetResult {
    moneyByMonth: MonthlySeries
    hoursByMonth: MonthlySeries | null
    byCategoryMoney: Record<number, MonthlySeries>
    byCategoryHours: Record<number, MonthlySeries> | null
    varianceHoursByMonth?: MonthlySeries | null
    varianceByCategoryHours?: Record<number, MonthlySeries> | null
}

export async function computeBudgetsInTime(
    allocations: BudgetAllocationRow[],
    months: MonthKey[],
    ctx: EngineContext,
    expenseByCategoryHours?: Record<number, MonthlySeries>
): Promise<BudgetResult> {
    const moneyByMonth: MonthlySeries = {};
    const hoursByMonth: MonthlySeries | null =
        ctx.hourlyRate && ctx.hourlyRate > 0 ? {} : null;

    for (const mk of months) {
        moneyByMonth[mk] = 0;
        if (hoursByMonth) hoursByMonth[mk] = 0;
    }

    const byCategoryMoney: Record<number, MonthlySeries> = {};
    const byCategoryHours: Record<number, MonthlySeries> | null = hoursByMonth
        ? {}
        : null;

    const monthSet = new Set(months);

    for (const alloc of allocations) {
        const winFrom = toMonthKey(alloc.period_start);
        const winTo = toMonthKey(alloc.period_end);
        const windowMonths = monthRange(winFrom, winTo).filter((mk) =>
            monthSet.has(mk)
        );
        if (!windowMonths.length) continue;

        const n = windowMonths.length;
        const base = Math.floor(alloc.amount_cents / n);
        let rem = alloc.amount_cents - base * n;

        for (const mk of windowMonths) {
            const centsPart = base + (rem > 0 ? 1 : 0);
            if (rem > 0) rem--;

            const mkStart = monthStart(mk).toDate();
            const portionUserMoney = await moneyToUser(
                centsPart,
                alloc.currency,
                mkStart,
                ctx
            );

            moneyByMonth[mk] += portionUserMoney;
            const cm = ensureCatSeries(byCategoryMoney, alloc.category_id, months);
            cm[mk] += portionUserMoney;

            if (hoursByMonth) {
                const h = moneyToHoursForMonth(portionUserMoney, mk, ctx) ?? 0;
                hoursByMonth[mk] += h;
                if (byCategoryHours) {
                    const ch = ensureCatSeries(byCategoryHours, alloc.category_id, months);
                    ch[mk] += h;
                }
            }
        }
    }

    let varianceHoursByMonth: MonthlySeries | null | undefined = null;
    let varianceByCategoryHours:
        | Record<number, MonthlySeries>
        | null
        | undefined = null;

    if (hoursByMonth && expenseByCategoryHours) {
        const budgetCatIds = Object.keys(byCategoryMoney).map(Number);
        const expenseSumForBudgetCats: MonthlySeries = months.reduce(
            (acc, mk) => ((acc[mk] = 0), acc),
            {} as MonthlySeries
        );

        for (const catId of budgetCatIds) {
            const expSeries = expenseByCategoryHours[catId];
            if (!expSeries) continue;
            for (const mk of months) {
                expenseSumForBudgetCats[mk] += expSeries[mk] || 0;
            }
        }

        varianceHoursByMonth = months.reduce((acc, mk) => {
            acc[mk] = (hoursByMonth[mk] || 0) - (expenseSumForBudgetCats[mk] || 0);
            return acc;
        }, {} as MonthlySeries);

        varianceByCategoryHours = {};
        for (const catId of budgetCatIds) {
            const bh = byCategoryHours?.[catId];
            const eh = expenseByCategoryHours[catId];
            if (!bh || !eh) continue;
            const varSeries: MonthlySeries = {};
            for (const mk of months) varSeries[mk] = (bh[mk] || 0) - (eh[mk] || 0);
            varianceByCategoryHours[catId] = varSeries;
        }
    }

    return {
        moneyByMonth,
        hoursByMonth,
        byCategoryMoney,
        byCategoryHours,
        varianceHoursByMonth: varianceHoursByMonth ?? null,
        varianceByCategoryHours: varianceByCategoryHours ?? null,
    };
}

export interface GoalRow {
    id: number
    name?: string
    currency: string
    target_amount_cents: number | null
    target_hours: number | null
}

export interface GoalContributionRow {
    goal_id: number
    contributed_at: string
    amount_cents?: number | null
    hours?: number | null
    source_type?: string
}

export interface GoalProgress {
    goal_id: number
    target_hours: number | null
    progress_hours: number
    remaining_hours: number | null
    eta_months: number | null
    needsHourlyRate?: boolean
}

export type GoalsResult = Record<number, GoalProgress>

export async function computeGoals(
    goals: GoalRow[],
    contributions: GoalContributionRow[],
    ctx: EngineContext,
    netSavingsHoursPerMonth?: number | null
): Promise<GoalsResult> {
    const byGoal: GoalsResult = {}
    const contribsByGoal = new Map<number, GoalContributionRow[]>()

    for (const c of contributions) {
        if (!contribsByGoal.has(c.goal_id)) contribsByGoal.set(c.goal_id, [])
        contribsByGoal.get(c.goal_id)!.push(c)
    }

    const haveHr = !!ctx.hourlyRate && ctx.hourlyRate > 0

    for (const g of goals) {
        let targetH: number | null = null
        let needsHourlyRate = false

        if (g.target_hours != null) {
            targetH = Number(g.target_hours)
        } else if (g.target_amount_cents != null) {
            if (!haveHr) {
                targetH = null
                needsHourlyRate = true
            } else {
                const userMoney = await moneyToUser(g.target_amount_cents, g.currency, new Date(), ctx)
                targetH = moneyToHours(userMoney, ctx)
            }
        }

        let progressH = 0
        const cs = contribsByGoal.get(g.id) || []
        for (const c of cs) {
            const hNative = Number(c.hours || 0)

            let hFromMoney = 0
            if (c.amount_cents != null && c.amount_cents !== 0) {
                if (!haveHr) {
                    needsHourlyRate = true
                } else {
                    const userMoney = await moneyToUser(c.amount_cents, g.currency, dayjs(c.contributed_at).toDate(), ctx)
                    hFromMoney = moneyToHours(userMoney, ctx) ?? 0
                }
            }

            progressH += hNative + hFromMoney
        }

        let remainingH: number | null = null
        if (targetH != null) remainingH = Math.max(0, targetH - progressH)

        let etaMonths: number | null = null
        if (remainingH != null && netSavingsHoursPerMonth && netSavingsHoursPerMonth > EPS) {
            etaMonths = remainingH / netSavingsHoursPerMonth
        }

        byGoal[g.id] = {
            goal_id: g.id,
            target_hours: targetH,
            progress_hours: progressH,
            remaining_hours: remainingH,
            eta_months: etaMonths,
            needsHourlyRate: needsHourlyRate || !haveHr || targetH == null,
        }
    }

    return byGoal
}

export interface AggregateResult {
    months: MonthKey[]

    incomeMoney: MonthlySeries
    incomeHours: MonthlySeries | null

    expenseMoney: MonthlySeries
    expenseHours: MonthlySeries | null

    objectsMaintHours: MonthlySeries | null
    objectsSavedHours: MonthlySeries
    objectsCapexHours?: MonthlySeries | null

    activitiesSavedHours: MonthlySeries
    activitiesExtraCostHours: MonthlySeries

    budgetMoney?: MonthlySeries
    budgetHours?: MonthlySeries | null
    budgetByCategoryMoney?: Record<number, MonthlySeries>
    budgetByCategoryHours?: Record<number, MonthlySeries> | null
    budgetVarianceHoursByMonth?: MonthlySeries | null
    budgetVarianceByCategoryHours?: Record<number, MonthlySeries> | null

    goalsProgress?: GoalsResult

    timeCostHours: MonthlySeries | null
    timeSavingsHours: MonthlySeries | null
    timeBurnNet: MonthlySeries | null

    costByCategoryHours?: Record<number, MonthlySeries> | null
    savingsByCategoryHours?: Record<number, MonthlySeries> | null

    netSavingsHoursPerMonth?: number | null

    activitiesRoi?: { id?: number; name?: string; roi_ratio: number | null; net_hours_per_occurrence: number | null }[]
    objectsMetrics?: ObjectStaticMetrics[]
    incomeBySourceMoney?: Record<string, MonthlySeries>

    forecastNet?: number[];
    forecastLabels?: MonthKey[];
    projectedBreakevenMonth?: MonthKey | null;
}

const num = (v: any) => (typeof v === 'number' && isFinite(v)) ? v : Number(v) || 0;

function addSeries(a: MonthlySeries | null, b: MonthlySeries | null): MonthlySeries | null {
    if (!a && !b) return null
    if (!a) return b ? Object.fromEntries(Object.entries(b).map(([k,v]) => [k, num(v)])) : null
    if (!b) return a ? Object.fromEntries(Object.entries(a).map(([k,v]) => [k, num(v)])) : null
    const out: MonthlySeries = {}
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) out[k] = num(a[k]) + num(b[k])
    return out
}

function addSeriesInPlace(dst: MonthlySeries, src?: MonthlySeries | null) {
    if (!src) return
    for (const k of Object.keys(src)) dst[k] = num(dst[k]) + num(src[k])
}

function normSeries(baseMonths: MonthKey[], s?: MonthlySeries | null): MonthlySeries | null {
    if (!s) return null
    const seed = baseMonths.reduce((acc, mk) => (acc[mk] = 0, acc), {} as MonthlySeries)
    for (const mk of Object.keys(s)) seed[mk] = num(s[mk])
    return seed
}


function addCategoryMap(
    baseMonths: MonthKey[],
    a?: Record<number, MonthlySeries> | null,
    b?: Record<number, MonthlySeries> | null,
    c?: Record<number, MonthlySeries> | null,
    d?: Record<number, MonthlySeries> | null
): Record<number, MonthlySeries> | null {
    const inputs = [a, b, c, d].filter(Boolean) as Record<number, MonthlySeries>[]
    if (!inputs.length) return null
    const out: Record<number, MonthlySeries> = {}
    const seed = baseMonths.reduce((acc, mk) => ((acc[mk] = 0), acc), {} as MonthlySeries)
    for (const m of inputs) {
        for (const cat of Object.keys(m)) {
            const id = Number(cat)
            if (!out[id]) out[id] = { ...seed }
            addSeriesInPlace(out[id], m[id])
        }
    }
    return out
}

function addMonthsKey(base: MonthKey, n: number): MonthKey {
    return dayjs(base + '-01').add(n, 'month').format('YYYY-MM');
}

function nextMonths(from: MonthKey, n: number): MonthKey[] {
    const out: MonthKey[] = [];
    for (let i = 1; i <= n; i++) out.push(addMonthsKey(from, i));
    return out;
}

function linearFit(y: number[]) {
    const n = y.length;
    const xs = y.map((_, i) => i);
    const sum = (arr: number[]) => arr.reduce((a, v) => a + v, 0);
    const sumx = sum(xs);
    const sumy = sum(y);
    const sumxx = sum(xs.map((x) => x * x));
    const sumxy = sum(xs.map((x, i) => x * y[i]));
    const denom = n * sumxx - sumx * sumx;
    const m = Math.abs(denom) < 1e-12 ? 0 : (n * sumxy - sumx * sumy) / denom;
    const b = (sumy - m * sumx) / n;
    return { m, b };
}


export function aggregate(
    months: MonthKey[],
    income: IncomeResult,
    expenses: ExpenseResult,
    objects: ObjectsResult,
    activities: ActivitiesResult,
    budgets?: BudgetResult | null,
): AggregateResult {
    const seed = (v: number = 0) => months.reduce((acc, mk) => (acc[mk] = v, acc), {} as MonthlySeries)

    const incomeMoney = { ...seed(0), ...income.moneyByMonth }
    const incomeHours = income.hoursByMonth ? { ...seed(0), ...income.hoursByMonth } : null

    const expenseMoney = { ...seed(0), ...expenses.moneyByMonth }
    const expenseHours = expenses.hoursByMonth ? { ...seed(0), ...expenses.hoursByMonth } : null

    const objectsMaintHours = objects.maintHoursByMonth ? { ...seed(0), ...objects.maintHoursByMonth } : null
    const objectsSavedHours = { ...seed(0), ...objects.savedHoursByMonth }
    const objectsCapexHours = objects.capexHoursAmortizedByMonth ? { ...seed(0), ...objects.capexHoursAmortizedByMonth } : null

    const activitiesSavedHours = { ...seed(0), ...activities.savedHoursByMonth }
    const activitiesExtraCostHours = { ...seed(0), ...activities.extraCostHoursByMonth }

    const costByCategoryHours = addCategoryMap(
        months,
        expenses.byCategoryHours ?? null,
        objects.byCategoryMaintHours ?? null,
        objects.byCategoryCapexHours ?? null,
        activities.byCategoryExtraCostHours ?? null,
    )
    const savingsByCategoryHours = addCategoryMap(
        months,
        objects.byCategorySavedHours ?? null,
        activities.byCategorySavedHours ?? null,
        null,
        null
    )

    const budgetMoney  = budgets ? { ...seed(0), ...budgets.moneyByMonth } : undefined
    const budgetHours  = budgets ? normSeries(months, budgets.hoursByMonth) : null
    const budgetByCategoryMoney = budgets?.byCategoryMoney
    const budgetByCategoryHours = budgets?.byCategoryHours
    const budgetVarianceHoursByMonth = budgets ? normSeries(months, budgets.varianceHoursByMonth ?? null) : null
    const budgetVarianceByCategoryHours = budgets?.varianceByCategoryHours ?? null

    let timeCostHours: MonthlySeries | null = addSeries(expenseHours, objectsMaintHours)
    timeCostHours = addSeries(timeCostHours, activitiesExtraCostHours)
    timeCostHours = addSeries(timeCostHours, objectsCapexHours || null)

    let timeSavingsHours: MonthlySeries | null = addSeries(objectsSavedHours, activitiesSavedHours)

    let timeBurnNet: MonthlySeries | null = null
    if (timeCostHours || timeSavingsHours) {
        timeBurnNet = {}
        for (const mk of months) {
            const c = timeCostHours ? (timeCostHours[mk] || 0) : 0
            const s = timeSavingsHours ? (timeSavingsHours[mk] || 0) : 0
            timeBurnNet[mk] = c - s
        }
    }

    let netSavingsHoursPerMonth: number | null = null
    if (timeCostHours || timeSavingsHours) {
        let sum = 0
        for (const mk of months) {
            const s = timeSavingsHours ? (timeSavingsHours[mk] || 0) : 0
            const c = timeCostHours ? (timeCostHours[mk] || 0) : 0
            sum += (s - c)
        }
        netSavingsHoursPerMonth = sum / Math.max(1, months.length)
    }

    const H = 3;
    let forecastNet: number[] | undefined;
    let forecastLabels: MonthKey[] | undefined;
    let projectedBreakevenMonth: MonthKey | null | undefined;

    if (timeBurnNet) {
        const yHist = months.map((mk) => Number(timeBurnNet![mk] ?? 0));
        const n = yHist.length;
        const { m, b } = linearFit(yHist);

        const future = nextMonths(months[months.length - 1], H);
        forecastLabels = [...months, ...future];

        forecastNet = [...yHist];
        for (let i = 0; i < H; i++) {
            const idx = n + i;
            forecastNet.push(b + m * idx);
        }

        const lastNow = yHist[n - 1];
        if (lastNow <= 0) {
            projectedBreakevenMonth = months[n - 1];
        } else if (Math.abs(m) > 1e-12) {
            const xZero = -b / m;
            if (m < 0 && xZero >= n) {
                const idxInt = Math.ceil(xZero);
                projectedBreakevenMonth = addMonthsKey(months[0], idxInt);
            } else {
                projectedBreakevenMonth = null;
            }
        } else {
            projectedBreakevenMonth = null;
        }
    }

    return {
        months,
        incomeMoney,
        incomeHours,
        expenseMoney,
        expenseHours,
        objectsMaintHours,
        objectsSavedHours,
        objectsCapexHours,
        activitiesSavedHours,
        activitiesExtraCostHours,

        budgetMoney,
        budgetHours,
        budgetByCategoryMoney,
        budgetByCategoryHours,
        budgetVarianceHoursByMonth,
        budgetVarianceByCategoryHours,

        timeCostHours,
        timeSavingsHours,
        timeBurnNet,

        costByCategoryHours,
        savingsByCategoryHours,
        netSavingsHoursPerMonth,

        forecastNet,
        forecastLabels,
        projectedBreakevenMonth,
    }
}


export interface EngineInputs {
    months: MonthKey[]
    ctx: EngineContext
    incomeRows: IncomeRow[]
    expenseRows: ExpenseRow[]
    objectRows: ObjectRow[]
    activityRows: ActivityRow[]
    budgetAllocations?: BudgetAllocationRow[]

    goals?: GoalRow[]
    goalContributions?: GoalContributionRow[]
}


export async function runEngine(input: EngineInputs): Promise<AggregateResult> {
    const [income, expenses, objects, activities] = await Promise.all([
        computeIncomeByMonth(input.incomeRows, input.months, input.ctx),
        computeExpensesByMonth(input.expenseRows, input.months, input.ctx),
        computeObjects(input.objectRows, input.months, input.ctx),
        computeActivities(input.activityRows, input.months, input.ctx),
    ])

    let budgets: BudgetResult | null = null
    if (input.budgetAllocations && input.budgetAllocations.length) {
        budgets = await computeBudgetsInTime(
            input.budgetAllocations,
            input.months,
            input.ctx,
            expenses.byCategoryHours ?? undefined
        )
    }

    const agg = aggregate(input.months, income, expenses, objects, activities, budgets)

    agg.activitiesRoi = activities.roiByActivity
    agg.objectsMetrics = objects.metrics
    agg.incomeBySourceMoney = income.bySourceMoney

    if (input.goals && input.goals.length) {
        agg.goalsProgress = await computeGoals(
            input.goals,
            input.goalContributions ?? [],
            input.ctx,
            agg.netSavingsHoursPerMonth ?? null
        )
    }

    return agg
}

