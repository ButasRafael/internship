import dayjs from 'dayjs';
import { pool } from '../config/db.js';
import { AlertRow } from '../models/alert.model.js';
import { sendWebNotification } from './notificationService.js';
import type { RowDataPacket } from 'mysql2/promise';

import {
    computeIncomeByMonth,
    computeExpensesByMonth,
    computeObjects,
    toMonthKey,
    monthRange,
    type EngineContext,
    type ObjectStaticMetrics,
} from '../shared/time-engine.js';


function parseCfg<T>(v: unknown, fallback: T): T {
    if (v == null) return fallback;
    if (typeof v === 'string') {
        try { return JSON.parse(v) as T; } catch { return fallback; }
    }
    if (typeof v === 'object') return v as T;
    return fallback;
}


// ---- typed row helpers ---------------------------------------------------

interface UserBaseRow extends RowDataPacket {
    id: number;
    email: string;
    hourly_rate: number | null;
    currency: string;
    timezone: string | null;
}

interface IncomeRowDB extends RowDataPacket {
    received_at: string;
    amount_cents: number;
    currency: string;
    source: string;
    recurring: string;
}

interface ExpenseRowDB extends RowDataPacket {
    amount_cents: number;
    currency: string;
    frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    end_date: string | null;
    is_active: 0 | 1;
    category_id: number | null;
}

interface ObjectRowDB extends RowDataPacket {
    id: number;
    name: string;
    price_cents: number;
    currency: string;
    purchase_date: string;
    expected_life_months: number;
    maintenance_cents_per_month: number;
    hours_saved_per_month: number;
    category_id: number | null;
}

interface IdRow extends RowDataPacket {
    id: number;
}

// ---- helpers -------------------------------------------------------------

async function getUserBase(userId: number) {
    const [rows] = await pool.execute<UserBaseRow[]>(
        `SELECT id, email, hourly_rate, currency, timezone
         FROM users WHERE id=? LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
}

async function fx(from: string, to: string, at: Date): Promise<number> {
    const ymd = dayjs(at).format('YYYY-MM-DD');
    from = from.toUpperCase();
    to = to.toUpperCase();
    if (from === to) return 1;

    // base->RON and quote->RON lookups
    const q = `SELECT rate FROM exchange_rates
               WHERE day<=? AND base=? AND quote='RON'
               ORDER BY day DESC LIMIT 1`;

    if (from === 'RON') {
        const [r2] = await pool.execute<RowDataPacket[]>(q, [ymd, to]);
        const rateToRON = (r2[0] as any)?.rate as number | undefined;
        if (!rateToRON) return 1;
        return 1 / rateToRON;
    }
    if (to === 'RON') {
        const [r1] = await pool.execute<RowDataPacket[]>(q, [ymd, from]);
        const rateFromToRON = (r1[0] as any)?.rate as number | undefined;
        return rateFromToRON || 1;
    }

    const [rf] = await pool.execute<RowDataPacket[]>(q, [ymd, from]);
    const [rt] = await pool.execute<RowDataPacket[]>(q, [ymd, to]);
    const fromToRON = (rf[0] as any)?.rate as number | undefined;
    const toToRON = (rt[0] as any)?.rate as number | undefined;
    if (!fromToRON || !toToRON) return 1;
    return fromToRON / toToRON;
}

function makeCtx(user: { currency: string; hourly_rate: number | null }): EngineContext {
    return {
        userCurrency: user.currency || 'RON',
        hourlyRate: user.hourly_rate ? Number(user.hourly_rate) : null,
        fx,
        amortizeOneTimeMonths: 0,
        amortizeCapexMonths: 12,
        impliedSalary: { enabled: false },
    };
}

// ---- raw data ------------------------------------------------------------

async function getIncomeRows(userId: number) {
    const [rows] = await pool.execute<IncomeRowDB[]>(
        `SELECT received_at, amount_cents, currency, source, recurring
         FROM incomes WHERE user_id=?`,
        [userId]
    );
    return rows;
}

async function getExpenseRows(userId: number) {
    const [rows] = await pool.execute<ExpenseRowDB[]>(
        `SELECT amount_cents, currency, frequency, start_date, end_date, is_active, category_id
         FROM expenses WHERE user_id=?`,
        [userId]
    );
    return rows;
}

async function getObjects(userId: number) {
    const [rows] = await pool.execute<ObjectRowDB[]>(
        `SELECT id, name, price_cents, currency, purchase_date, expected_life_months,
                maintenance_cents_per_month, hours_saved_per_month, category_id
         FROM objects WHERE user_id=?`,
        [userId]
    );
    return rows;
}

async function getCategoryIdByName(userId: number, name: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM categories WHERE user_id=? AND name=? LIMIT 1`,
        [userId, name]
    );
    return (rows[0] as any)?.id ?? null;
}

// ---- each rule -----------------------------------------------------------

async function rule_percent_expenses_of_income(userId: number, alert: AlertRow, ctx: EngineContext) {
    const cfg = parseCfg<{ threshold?: number }>(alert.rule_config, {});
    const threshold = Number(cfg.threshold ?? 0.3); // default 30%

    const nowMk = toMonthKey(new Date());
    const months = [nowMk];

    const [incomes, expenses] = await Promise.all([getIncomeRows(userId), getExpenseRows(userId)]);
    const [inc, exp] = await Promise.all([
        computeIncomeByMonth(incomes as any, months, ctx),
        computeExpensesByMonth(expenses as any, months, ctx),
    ]);

    const income = inc.moneyByMonth[nowMk] || 0;
    const spent = exp.moneyByMonth[nowMk] || 0;

    if (income <= 0) return;

    const ratio = spent / income;
    if (ratio > threshold) {
        await sendWebNotification(userId, alert.id, {
            title: 'Spending threshold exceeded',
            message: `This month you're at ${(ratio * 100).toFixed(1)}% of income (threshold ${(threshold * 100).toFixed(0)}%).`,
            severity: 'warning',
            meta: { income, spent, ratio, month: nowMk },
            dedupe_key: `${nowMk}|ratio>${threshold}`,
        });
    }
}

async function rule_budget_overrun(userId: number, alert: AlertRow, ctx: EngineContext) {
    // config: { category: "Food", limit_cents: 100000 }
    const cfg = parseCfg<{ category?: string; limit_cents?: number }>(alert.rule_config, {});
    if (!cfg.category || !Number.isFinite(cfg.limit_cents)) return;

    const categoryId = await getCategoryIdByName(userId, String(cfg.category));
    if (!categoryId) return;

    const nowMk = toMonthKey(new Date());
    const months = [nowMk];

    const expenses = await getExpenseRows(userId);
    const er = await computeExpensesByMonth(expenses as any, months, ctx);

    const catSeries = er.byCategoryMoney?.[categoryId];
    const spent = catSeries?.[nowMk] ?? 0;
    const limitUserMoney = (Number(cfg.limit_cents) || 0) / 100;

    if (spent > limitUserMoney) {
        await sendWebNotification(userId, alert.id, {
            title: `Budget overrun: ${cfg.category}`,
            message: `Spent ${spent.toFixed(2)} ${ctx.userCurrency} > limit ${limitUserMoney.toFixed(2)} ${ctx.userCurrency}.`,
            severity: 'error',
            meta: { category: cfg.category, spent, limit: limitUserMoney, month: nowMk },
            dedupe_key: `${nowMk}|cat:${categoryId}|>${limitUserMoney}`,
        });
    }
}

async function rule_object_breakeven_reached(userId: number, alert: AlertRow, ctx: EngineContext) {
    const cfg = parseCfg<{ object_name?: string }>(alert.rule_config, {});
    if (!cfg.object_name) return;

    const rows = await getObjects(userId);
    const obj = rows.find((o) => String(o.name).toLowerCase() === String(cfg.object_name).toLowerCase());
    if (!obj) return;

    const startMk = toMonthKey(obj.purchase_date);
    const nowMk = toMonthKey(new Date());

    const months = monthRange(startMk, nowMk);
    const or = await computeObjects(rows as any, months, ctx);

    const m = or.metrics.find((mm: ObjectStaticMetrics) => mm.id === obj.id);
    if (!m || m.payback_months == null || m.payback_months <= 0) return;

    const monthsSince = Math.max(0, dayjs().diff(dayjs(obj.purchase_date), 'month'));
    if (monthsSince + 1 >= Math.ceil(m.payback_months)) {
        await sendWebNotification(userId, alert.id, {
            title: `Breakeven reached: ${obj.name}`,
            message: `${obj.name} has reached payback (${Math.ceil(m.payback_months)} months).`,
            severity: 'success',
            meta: { object_id: obj.id, months_since: monthsSince, payback_months: m.payback_months },
            dedupe_key: `breakeven|obj:${obj.id}`,
        });
    }
}

// ---- public API ----------------------------------------------------------

type RuleFn = (userId: number, alert: AlertRow, ctx: EngineContext) => Promise<void>;
const RULES: Record<string, RuleFn> = {
    percent_expenses_of_income: rule_percent_expenses_of_income,
    budget_overrun: rule_budget_overrun,
    object_breakeven_reached: rule_object_breakeven_reached,
};

export async function evaluateAlertsForUser(userId: number) {
    const user = await getUserBase(userId);
    if (!user) return;

    const ctx = makeCtx(user);

    const [alerts] = await pool.execute<AlertRow[]>(
        `SELECT * FROM alerts WHERE user_id=? AND is_active=1`,
        [userId]
    );

    for (const a of alerts) {
        const fn = RULES[a.rule_type];
        if (!fn) continue;
        try {
            await fn(userId, a, ctx);
        } catch (e) {
            console.error('[alerts] rule failed', a.id, a.rule_type, e);
        }
    }
}

export async function evaluateAllActiveAlerts() {
    const [rows] = await pool.execute<IdRow[]>(
        `SELECT DISTINCT user_id AS id FROM alerts WHERE is_active=1`
    );
    for (const r of rows) {
        await evaluateAlertsForUser(r.id);
    }
}
