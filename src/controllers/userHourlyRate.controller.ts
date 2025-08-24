import { Request, Response } from 'express';
import { UserHourlyRate } from '../models/userHourlyRate.model.js';
import { monthRange } from '../shared/time-engine.js';
import dayjs from 'dayjs';

type Params = { userId: string };

export const listRates = async (
    req: Request<Params, unknown, unknown, { from?: string; to?: string }>,
    res: Response,
): Promise<void> => {
    const userId = Number(req.params.userId);
    const from = req.query.from;
    const to = req.query.to;

    if (from && to) {
        const range = monthRange(from, to);
        if (!range.length) {
            res.json([]);
            return;
        }
        const rows = await UserHourlyRate.listUpToMonth(userId, to);
        let lastRate: number | null = null;
        const byMonth: Record<string, number> = {};
        for (const r of rows) {
            const ym = dayjs(r.effective_month as any).format('YYYY-MM');
            lastRate = Number(r.hourly_rate);
            byMonth[ym] = lastRate;
        }
        const out = range.map((mk) => ({
            month: mk,
            hourly_rate: byMonth[mk] != null ? byMonth[mk] : lastRate,
        }));
        res.json(out);
        return;
    }

    const rows = await UserHourlyRate.listByUser(userId);
    res.json(rows.map(r => ({ month: dayjs(r.effective_month as any).format('YYYY-MM'), hourly_rate: Number(r.hourly_rate) })));
};

export const upsertRate = async (
    req: Request<Params, unknown, { month?: string; hourly_rate?: number }>,
    res: Response,
): Promise<void> => {
    const userId = Number(req.params.userId);
    const { month, hourly_rate } = req.body || {};

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        res.status(400).json({ error: 'Invalid month. Expected YYYY-MM' });
        return;
    }
    const rateNum = Number(hourly_rate);
    if (!Number.isFinite(rateNum) || rateNum < 0) {
        res.status(400).json({ error: 'Invalid hourly_rate' });
        return;
    }

    const row = await UserHourlyRate.upsert(userId, month, rateNum);
    res.status(200).json({ month, hourly_rate: Number(row?.hourly_rate ?? rateNum) });
};
