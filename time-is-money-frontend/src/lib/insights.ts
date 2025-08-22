// src/lib/insights.ts
import dayjs from 'dayjs';
import {
    type MonthKey,
    type AggregateResult,
    moneyToUser,
    moneyToHours,
    type EngineContext,
    monthStart,
    freqToMonthly,
} from '@/lib/time-engine';

export type InsightMonth = MonthKey;

export function currentMonthKey(): InsightMonth {
    return dayjs().startOf('month').format('YYYY-MM');
}

export function fmtH(h: number | null | undefined) {
    if (h == null) return '—';
    return `${h.toFixed(1)} h`;
}

/* ────────────────────────────────────────────────────────────────────────────
   SELECTORS — engine-backed, read-only
   ──────────────────────────────────────────────────────────────────────────── */

export type CategoryTimeInsight = {
    savedH: number;
    costH: number | null;
    netH: number | null;
};

export function selectCategoryTimeInsight(
    agg: AggregateResult | undefined,
    month: MonthKey,
    categoryId: number
): CategoryTimeInsight {
    const saved = agg?.savingsByCategoryHours?.[categoryId]?.[month] ?? 0;
    const cost = agg?.costByCategoryHours ? (agg.costByCategoryHours[categoryId]?.[month] ?? 0) : null;
    const net = cost != null ? cost - saved : null;
    return { savedH: saved, costH: cost, netH: net };
}

export function selectCategoryTimeInsightsForMonth(
    agg: AggregateResult | undefined,
    month: MonthKey,
    categoryIds: number[]
): Record<number, CategoryTimeInsight> {
    const out: Record<number, CategoryTimeInsight> = {};
    for (const id of categoryIds) out[id] = selectCategoryTimeInsight(agg, month, id);
    return out;
}

export function selectTimeTotalsForMonth(agg: AggregateResult | undefined, month: MonthKey) {
    const cost = agg?.timeCostHours?.[month] ?? null;
    const savings = agg?.timeSavingsHours?.[month] ?? null;
    const net = agg?.timeBurnNet?.[month] ?? (cost != null && savings != null ? cost - savings : null);
    return { costH: cost, savingsH: savings, netH: net };
}

export function selectBudgetVsActualForMonth(agg: AggregateResult | undefined, month: MonthKey) {
    const budgetH = agg?.budgetHours?.[month] ?? null;
    const varianceH = agg?.budgetVarianceHoursByMonth?.[month] ?? null; // Budget − Actual
    const actualH = budgetH != null && varianceH != null ? budgetH - varianceH : null;
    return { budgetH, actualH, varianceH };
}

export function selectGoalsProgress(agg: AggregateResult | undefined) {
    return agg?.goalsProgress ?? null;
}

export function selectActivitiesRoi(agg: AggregateResult | undefined) {
    return agg?.activitiesRoi ?? null;
}

export function selectObjectsMetrics(agg: AggregateResult | undefined) {
    return agg?.objectsMetrics ?? null;
}

export function selectMoneyForMonth(
    agg: AggregateResult | undefined,
    month: MonthKey
): { income: number | null; expense: number | null; net: number | null } {
    const inc = agg?.incomeMoney?.[month] ?? null;
    const exp = agg?.expenseMoney?.[month] ?? null;
    const net = inc != null && exp != null ? inc - exp : null;
    return { income: inc, expense: exp, net };
}

export function selectIncomeBySourceTotals(
    agg: AggregateResult | undefined,
    months: MonthKey[]
): Array<{ source: string; total: number }> | null {
    const bySrc = agg?.incomeBySourceMoney;
    if (!bySrc) return null;
    const totals: Array<{ source: string; total: number }> = [];
    for (const source of Object.keys(bySrc)) {
        const sum = months.reduce((s, mk) => s + (bySrc[source]?.[mk] ?? 0), 0);
        if (sum > 0) totals.push({ source, total: sum });
    }
    return totals;
}

/* ────────────────────────────────────────────────────────────────────────────
   HELPERS — stable conversions (no page-specific engine math)
   ──────────────────────────────────────────────────────────────────────────── */

export async function allocationHoursForBudget(
    alloc: { amount_cents: number },
    budget: { currency: string; period_start: string },
    ctx: EngineContext
) {
    const userAmt = await moneyToUser(
        alloc.amount_cents,
        budget.currency,
        dayjs(budget.period_start).toDate(),
        ctx
    );
    return moneyToHours(userAmt, ctx);
}

export async function allocationHoursTotalForBudget(
    allocs: Array<{ amount_cents: number }>,
    budget: { currency: string; period_start: string },
    ctx: EngineContext
): Promise<number> {
    const hs = await Promise.all(allocs.map((a) => allocationHoursForBudget(a, budget, ctx)));
    return hs.reduce((sum: number, h) => sum + (h ?? 0), 0);
}

export async function activitySnapshotForMonth(
    a: {
        duration_minutes: number;
        frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
        direct_cost_cents: number | null;
        currency: string;
    },
    month: MonthKey,
    ctx: EngineContext
) {
    const k = freqToMonthly(a.frequency);
    const mkStart = monthStart(month).toDate();
    const timeCostH = (Number(a.duration_minutes) || 0) / 60;
    const moneyUser = await moneyToUser(Number(a.direct_cost_cents) || 0, a.currency, mkStart, ctx);
    const moneyH = moneyToHours(moneyUser, ctx);
    const perOccCostH = moneyH == null ? null : timeCostH + moneyH;
    return { k, timeCostH, moneyH, perOccCostH };
}

export async function expenseHoursThisMonth(
    e: {
        amount_cents: number;
        currency: string;
        frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
        start_date: string;
        end_date: string | null;
    },
    month: MonthKey,
    ctx: EngineContext & { amortizeOneTimeMonths?: number | null }
): Promise<number | null> {
    if (!ctx.hourlyRate || ctx.hourlyRate <= 0) return null;

    const mk = dayjs(month + '-01');
    const inRange =
        !dayjs(e.start_date).isAfter(mk.endOf('month')) &&
        (!e.end_date || !mk.startOf('month').isAfter(dayjs(e.end_date)));

    if (!inRange) return 0;

    if (e.frequency === 'once') {
        const n = Math.max(0, Number(ctx.amortizeOneTimeMonths) || 0);
        const amtUser = await moneyToUser(e.amount_cents, e.currency, dayjs(e.start_date).toDate(), ctx);
        const hTotal = moneyToHours(amtUser, ctx) ?? 0;
        if (n > 0) return hTotal / n;
        const startMk = dayjs(e.start_date).format('YYYY-MM');
        return startMk === month ? hTotal : 0;
    }

    const k = freqToMonthly(e.frequency);
    const user = await moneyToUser(e.amount_cents, e.currency, mk.startOf('month').toDate(), ctx);
    const h = moneyToHours(user, ctx) ?? 0;
    return h * k;
}

/** Object snapshot for a month (stable conversions + optional capex amort). */
export async function objectSnapshotForMonth(
    o: {
        price_cents: number;
        currency: string;
        purchase_date: string;
        maintenance_cents_per_month: number;
        hours_saved_per_month: number;
    },
    month: MonthKey,
    ctx: EngineContext & { amortizeCapexMonths?: number | null }
) {
    // maintenance valued at the start of the target month
    const mkStart = monthStart(month).toDate();
    const maintUser = await moneyToUser(o.maintenance_cents_per_month, o.currency, mkStart, ctx);
    const maintH = moneyToHours(maintUser, ctx);

    // capex valued on purchase date, optionally amortized
    let capexHport: number | null = null;
    if (ctx.hourlyRate && ctx.hourlyRate > 0 && (ctx.amortizeCapexMonths ?? 0) > 0) {
        const capexUser = await moneyToUser(o.price_cents, o.currency, dayjs(o.purchase_date).toDate(), ctx);
        const capexH = moneyToHours(capexUser, ctx);
        if (capexH != null) capexHport = capexH / (ctx.amortizeCapexMonths as number);
    }

    const savedH = Number(o.hours_saved_per_month) || 0;
    const hasCost = maintH != null || capexHport != null;
    const netH = hasCost ? (maintH ?? 0) + (capexHport ?? 0) - savedH : null;

    return { maintH, capexHport, savedH, netH };
}

export async function incomeSnapshotForMonth(
    r: {
        amount_cents: number;
        currency: string;
        recurring: 'none' | 'weekly' | 'monthly' | 'yearly';
        received_at: string;
    },
    month: MonthKey,
    ctx: EngineContext
): Promise<{ moneyUserThisMonth: number; hoursThisMonth: number | null }> {
    // default outputs
    let moneyUserThisMonth = 0;
    let hoursThisMonth: number | null = ctx.hourlyRate && ctx.hourlyRate > 0 ? 0 : null;

    if (r.recurring === 'none') {
        // one-off income counts only in its received month
        const recMk = dayjs(r.received_at).format('YYYY-MM');
        if (recMk === month) {
            const user = await moneyToUser(r.amount_cents, r.currency, dayjs(r.received_at).toDate(), ctx);
            moneyUserThisMonth = user;
            if (hoursThisMonth != null) hoursThisMonth = moneyToHours(user, ctx);
        }
        return { moneyUserThisMonth, hoursThisMonth };
    }

    // recurring: pro-rate to month using the stable mapping
    const k = freqToMonthly(r.recurring);
    const userOnMonth = await moneyToUser(r.amount_cents, r.currency, monthStart(month).toDate(), ctx);
    moneyUserThisMonth = userOnMonth * k;
    if (hoursThisMonth != null) hoursThisMonth = moneyToHours(moneyUserThisMonth, ctx);
    return { moneyUserThisMonth, hoursThisMonth };
}

export async function goalContributionInsight(
    c: {
        contributed_at: string | null;
        amount_cents: number | null;
        hours: number | null;
    },
    goalCurrency: string,
    ctx: EngineContext
): Promise<{
    moneyUser: number;            // amount valued in user's currency (0 if null)
    hoursFromMoney: number | null;// hours derived from amount (null if no hourly rate)
    hoursNative: number;          // raw hours field (defaults to 0)
    hoursTotal: number | null;    // hoursNative + hoursFromMoney (null if no hourly rate)
}> {
    const when = c.contributed_at ? dayjs(c.contributed_at).toDate() : new Date();
    const amtCents = Number(c.amount_cents) || 0;

    const moneyUser = await moneyToUser(amtCents, goalCurrency, when, ctx);
    const hFromMoney = moneyToHours(moneyUser, ctx); // null if no hourly rate

    const hNative = Number(c.hours) || 0;
    const hoursTotal = hFromMoney == null ? null : hNative + hFromMoney;

    return {
        moneyUser,
        hoursFromMoney: hFromMoney,
        hoursNative: hNative,
        hoursTotal,
    };
}

export async function goalTargetInsight(
    g: {
        target_amount_cents: number | null;
        target_hours: number | null;
        currency: string;
    },
    ctx: EngineContext
): Promise<{ targetH: number | null; needsHourlyRate: boolean }> {
    // If target is already in hours, no conversion required.
    if (g.target_hours != null) return { targetH: Number(g.target_hours), needsHourlyRate: false };

    // Money target → hours (requires hourly rate).
    if (g.target_amount_cents != null) {
        if (!ctx.hourlyRate || ctx.hourlyRate <= 0)
            return { targetH: null, needsHourlyRate: true };

        const moneyUser = await moneyToUser(
            Number(g.target_amount_cents) || 0,
            g.currency,
            new Date(),
            ctx
        );
        const h = moneyToHours(moneyUser, ctx);
        return { targetH: h == null ? null : h, needsHourlyRate: h == null };
    }

    // No target provided.
    return { targetH: null, needsHourlyRate: false };
}

/** Sum up contributions → progress hours (stable, engine-consistent valuation). */
export async function goalProgressInsight(
    contribs: Array<{ contributed_at: string | null; amount_cents: number | null; hours: number | null }>,
    goalCurrency: string,
    ctx: EngineContext
): Promise<{ progressH: number; needsHourlyRate: boolean }> {
    let progressNative = 0;
    let progressFromMoney = 0;
    let needsRate = false;

    for (const c of contribs) {
        progressNative += Number(c.hours || 0);

        const cents = Number(c.amount_cents || 0);
        if (cents !== 0) {
            if (!ctx.hourlyRate || ctx.hourlyRate <= 0) {
                needsRate = true;
            } else {
                const when = c.contributed_at ? dayjs(c.contributed_at).toDate() : new Date();
                const moneyUser = await moneyToUser(cents, goalCurrency, when, ctx);
                const h = moneyToHours(moneyUser, ctx) ?? 0;
                progressFromMoney += h;
            }
        }
    }

    return { progressH: progressNative + progressFromMoney, needsHourlyRate: needsRate };
}

/** Simple ETA helper based on net savings hours/month (if available). */
export function goalEtaMonths(
    remainingH: number | null,
    netSavingsHoursPerMonth: number | null | undefined
): number | null {
    if (remainingH == null) return null;
    const rate = Number(netSavingsHoursPerMonth || 0);
    if (rate > 0) return remainingH / rate;
    return null;
}
