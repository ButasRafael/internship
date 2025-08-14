import {useMemo, useState} from 'react'
import dayjs from 'dayjs'
import {Alert, Box, Chip, Divider, Grid, LinearProgress, Paper, Stack, Typography, useTheme,} from '@mui/material'
import {LineChart} from '@mui/x-charts/LineChart'
import {BarChart} from '@mui/x-charts/BarChart'
import {PieChart} from '@mui/x-charts/PieChart'
import {useAuth} from '@/store/auth.store'
import {useTimeEngine} from '@/hooks/useTimeEngine'
import { Tooltip } from '@mui/material'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import * as React from "react";

function lastNMonths(n: number) {
    const end = dayjs().startOf('month')
    const start = end.subtract(n - 1, 'month')
    return { startMonth: start.format('YYYY-MM'), endMonth: end.format('YYYY-MM') }
}

function fmtHours(h: number | null | undefined) {
    const v = typeof h === 'number' ? h : 0
    return `${v.toFixed(1)} h`
}

const EPS = 1e-6

const TILE_SX = {
    p: 3,
    borderRadius: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
} as const;

const CHART_CARD_SX = {
    p: 3,
    borderRadius: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
} as const;

const CHART_H = 260;

type ExplainProps = {
    title?: string
    label?: string
    what: string
    how?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    children: React.ReactNode
}

export function Explain({ title, label, what, how, placement = 'top', children }: ExplainProps) {
    const heading = title ?? label ?? '';
    return (
        <Tooltip
            arrow
            placement={placement}
            slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
            title={
                <Stack spacing={0.75}>
                    <Typography variant="subtitle2" fontWeight={700}>{heading}</Typography>
                    <Typography variant="body2">{what}</Typography>
                    {how && (
                        <Typography variant="caption" color="text.secondary">
                            {how}
                        </Typography>
                    )}
                </Stack>
            }
        >
            <Box sx={{ position: 'relative', height: '100%' }}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        opacity: 0.38,
                        color: 'text.secondary',
                        '&:hover': { opacity: 1 },
                        pointerEvents: 'none',
                    }}
                >
                    <InfoOutlined fontSize="small" />
                </Box>
                {children}
            </Box>
        </Tooltip>
    );
}

export default function ImprovedDashboardPage() {
    const theme = useTheme()
    const user = useAuth((s) => s.user)
    const userId = user?.id ?? null
    const { startMonth, endMonth } = lastNMonths(6)

    const settings = useMemo(
        () => ({
            userCurrency: user?.currency ?? 'RON',
            hourlyRate: user?.hourly_rate ?? null,
            amortizeOneTimeMonths: 3,
            amortizeCapexMonths: 6,
            impliedSalary: { enabled: false, hoursPerWeek: 40 },
        }),
        [user?.currency, user?.hourly_rate]
    )

    const fmtMoney = (v: number | null | undefined) =>
        new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: settings.userCurrency,
            maximumFractionDigits: 0,
        }).format(typeof v === 'number' ? v : 0)


    const { agg, months, isLoading, error } = useTimeEngine({
        userId,
        startMonth,
        endMonth,
        settings,
    })

    const [view, setView] = useState<'hours' | 'money'>('hours')

    if (!userId || !months.length) return <LinearProgress />
    const currentMonth = months[months.length - 1]
    const prevMonth = months.length > 1 ? months[months.length - 2] : null

    const topTiles = useMemo(() => {
        const cost = agg?.timeCostHours?.[currentMonth] ?? 0
        const savings = agg?.timeSavingsHours?.[currentMonth] ?? 0
        const net = agg?.timeBurnNet?.[currentMonth] ?? cost - savings
        const prev = prevMonth ? agg?.timeBurnNet?.[prevMonth] ?? 0 : null
        const mom = prev != null ? net - prev : null

        let good = 0
        for (const mk of months) if ((agg?.timeBurnNet?.[mk] ?? 0) <= 0) good++
        let streak = 0
        for (let i = months.length - 1; i >= 0; i--) {
            const v = agg?.timeBurnNet?.[months[i]] ?? 0
            if (v <= 0) streak++
            else break
        }

        return { cost, savings, net, mom, goodShare: months.length ? good / months.length : 0, streak }
    }, [agg, months, currentMonth, prevMonth])

    const cumNetSeries = useMemo(() => {
        let cum = 0
        return months.map((mk) => (cum += agg?.timeBurnNet?.[mk] ?? 0))
    }, [agg, months])

    const xMonths = useMemo(
        () => ({ scaleType: 'point' as const, data: months.map((mk) => dayjs(mk + '-01').format('MMM')) }),
        [months]
    )

    const trendSeries = useMemo(() => [
        { label: 'Costs',   data: months.map(m => agg?.timeCostHours?.[m] ?? 0),   color: theme.palette.error.main },
        { label: 'Savings', data: months.map(m => agg?.timeSavingsHours?.[m] ?? 0), color: theme.palette.success.main },
        { label: 'Net',     data: months.map(m => (agg?.timeBurnNet?.[m] ?? null)), color: theme.palette.primary.main },
    ], [agg, months, theme.palette]);


    const stackedCost = useMemo(() => {
        if (!agg) return null
        const exp = agg.expenseHours
        const maint = agg.objectsMaintHours
        const extra = agg.activitiesExtraCostHours
        const capex = agg.objectsCapexHours
        return {
            x: { scaleType: 'band' as const, data: months.map((mk) => dayjs(mk + '-01').format('MMM')) },
            series: [
                { label: 'Expenses', data: months.map((m) => exp?.[m] ?? 0), stack: 'cost' },
                { label: 'Maintenance', data: months.map((m) => maint?.[m] ?? 0), stack: 'cost' },
                { label: 'Activity extra', data: months.map((m) => extra?.[m] ?? 0), stack: 'cost' },
                { label: 'Capex amort.', data: months.map((m) => capex?.[m] ?? 0), stack: 'cost' },
            ],
        }
    }, [agg, months])

    const stackedSavings = useMemo(() => {
        if (!agg) return null
        const obj = agg.objectsSavedHours
        const act = agg.activitiesSavedHours
        return {
            x: { scaleType: 'band' as const, data: months.map((mk) => dayjs(mk + '-01').format('MMM')) },
            series: [
                { label: 'Objects', data: months.map((m) => obj?.[m] ?? 0), stack: 'savings' },
                { label: 'Activities', data: months.map((m) => act?.[m] ?? 0), stack: 'savings' },
            ],
        }
    }, [agg, months])

    const budgetVsActual = useMemo(() => {
        if (!agg?.budgetHours || !agg?.budgetVarianceHoursByMonth) return null
        const budget = agg.budgetHours
        const actual = months.reduce((acc: Record<string, number>, mk) => {
            acc[mk] = (agg.budgetHours?.[mk] ?? 0) - (agg.budgetVarianceHoursByMonth?.[mk] ?? 0)
            return acc
        }, {})
        return {
            x: { scaleType: 'point' as const, data: months.map((mk) => dayjs(mk + '-01').format('MMM')) },
            series: [
                { name: 'Budget', data: months.map((m) => budget?.[m] ?? 0) },
                { name: 'Actual', data: months.map((m) => actual[m] ?? 0) },
            ],
        }
    }, [agg, months])

    const topBudgetVariances = useMemo(() => {
        const m = agg?.budgetVarianceByCategoryHours
        if (!m) return []
        const items = Object.entries(m).map(([id, series]) => ({
            id: Number(id),
            label: `Cat ${id}`,
            total: months.reduce((sum, mk) => sum + (series?.[mk] ?? 0), 0),
        }))
        items.sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
        return items.slice(0, 6)
    }, [agg, months])

    const moneySeries = useMemo(() => {
        if (!agg) return null
        const income = agg.incomeMoney
        const expense = agg.expenseMoney
        const netMoney = months.map((mk) => (income?.[mk] ?? 0) - (expense?.[mk] ?? 0))
        const netTimeValue = settings.hourlyRate
            ? months.map((mk) => (agg.timeBurnNet?.[mk] ?? 0) * (settings.hourlyRate as number))
            : null
        return {
            x: { scaleType: 'point' as const, data: months.map((mk) => dayjs(mk + '-01').format('MMM')) },
            income: months.map((m) => income?.[m] ?? 0),
            expense: months.map((m) => expense?.[m] ?? 0),
            netMoney,
            netTimeValue,
        }
    }, [agg, months, settings.hourlyRate])

    const moneyDerived = useMemo(() => {
        if (!moneySeries) return null
        const r = settings.hourlyRate ?? null
        const t = months.map((m) => agg?.timeBurnNet?.[m] ?? 0)

        const allInExpense = r != null
            ? moneySeries.expense.map((e, i) => e + t[i] * r)
            : null

        const allInNet = r != null
            ? moneySeries.income.map((inc, i) => inc - (allInExpense![i] ?? 0))
            : null

        const savingsRate = moneySeries.income.map((inc, i) =>
            inc > EPS ? moneySeries.netMoney[i] / inc : null
        )

        const allInSavingsRate = r != null
            ? moneySeries.income.map((inc, i) =>
                inc > EPS ? (allInNet![i] ?? 0) / inc : null
            )
            : null

        return { allInExpense, allInNet, savingsRate, allInSavingsRate }
    }, [moneySeries, agg, months, settings.hourlyRate])

    const moneyKpis = useMemo(() => {
        if (!moneySeries) return null
        const i = months.length - 1
        const prev = i > 0 ? i - 1 : null
        const net = moneySeries.netMoney[i] ?? 0
        const mom = prev != null ? net - (moneySeries.netMoney[prev] ?? 0) : null
        const income = moneySeries.income[i] ?? 0
        const sRate = income > EPS ? net / income : null

        const r = settings.hourlyRate ?? null
        const tNet = agg?.timeBurnNet?.[months[i]] ?? 0
        const allInNet = r != null ? net - tNet * r : null

        return { net, mom, sRate, allInNet }
    }, [moneySeries, months, settings.hourlyRate, agg])

    const reqNextMoney = useMemo(() => {
        if (!moneySeries) return null
        const a = moneySeries.netMoney
        const n = a.length
        if (!n) return null
        const nextNet = n >= 3 ? (a[n - 1] + a[n - 2] + a[n - 3]) / 3 : a[n - 1]
        const needed = nextNet < 0 ? -nextNet : 0
        const nextMonthName = dayjs(months[n - 1] + '-01').add(1, 'month').format('MMM YYYY')
        return { nextNet, needed, nextMonthName }
    }, [moneySeries, months])

    const incomeConcentration = useMemo(() => {
        const bySrc = agg?.incomeBySourceMoney
        if (!bySrc) return null
        const totals = Object.entries(bySrc)
            .map(([label, series]) => ({
                label,
                total: months.reduce((s, mk) => s + (series?.[mk] ?? 0), 0),
            }))
            .filter((x) => x.total > EPS)
            .sort((a, b) => b.total - a.total)

        const sum = totals.reduce((a, b) => a + b.total, 0)
        if (!sum) return null
        const hhi = totals.reduce((t, x) => {
            const s = x.total / sum
            return t + s * s
        }, 0)
        const topShare = totals[0] ? totals[0].total / sum : 0
        const topLabel = totals[0]?.label ?? ''
        return { hhi, topShare, topLabel }
    }, [agg, months])

    const savingsRateSeries = useMemo(
        () => moneyDerived?.savingsRate ?? [],
        [moneyDerived]
    )

    const cumNetMoney = useMemo(() => {
        if (!moneySeries) return [];
        let cum = 0;
        return moneySeries.netMoney.map((v) => (cum += v));
    }, [moneySeries]);

    const efficiencyTrend = useMemo(() => {
        if (!moneySeries) return null;
        return moneySeries.income.map((inc, i) =>
            inc > EPS ? (moneySeries.expense[i] ?? 0) / inc : null
        );
    }, [moneySeries]);

    const timeMoneyCoupling = useMemo(() => {
        if (!moneySeries) return null;
        const pairs = months.map((m, i) => {
            const x = agg?.timeBurnNet?.[m];
            const y = moneySeries.netMoney[i];
            return typeof x === 'number' && typeof y === 'number' ? [x, y] as [number, number] : null;
        }).filter(Boolean) as [number, number][];

        if (pairs.length < 3) return null;

        const n = pairs.length;
        let sumx = 0, sumy = 0, sumxx = 0, sumyy = 0, sumxy = 0;
        for (const [x, y] of pairs) {
            sumx += x; sumy += y; sumxx += x * x; sumyy += y * y; sumxy += x * y;
        }
        const denomR = Math.sqrt(Math.max(n * sumxx - sumx * sumx, 0) * Math.max(n * sumyy - sumy * sumy, 0));
        const r = denomR > EPS ? (n * sumxy - sumx * sumy) / denomR : 0;
        const denomB = (n * sumxx - sumx * sumx);
        const slope = Math.abs(denomB) > EPS ? (n * sumxy - sumx * sumy) / denomB : 0;

        return { r, slope };
    }, [agg, months, moneySeries]);


    const incomeBySourcePie = useMemo(() => {
        const bySrc = agg?.incomeBySourceMoney
        if (!bySrc) return null
        const totals: { label: string; value: number }[] = []
        for (const src of Object.keys(bySrc)) {
            const sum = months.reduce((s, mk) => s + (bySrc[src]?.[mk] ?? 0), 0)
            if (sum > EPS) totals.push({ label: src, value: sum })
        }
        if (!totals.length) return null
        return [
            {
                data: totals.map((t, i) => ({ id: i, value: t.value, label: t.label })),
                innerRadius: 30,
                paddingAngle: 5,
                cornerRadius: 2,
            },
        ]
    }, [agg, months])

    const goalsList = useMemo(() => {
        if (!agg?.goalsProgress) return []
        const rr = agg.netSavingsHoursPerMonth ?? 0
        return Object.values(agg.goalsProgress)
            .map((g) => {
                const status = !g.target_hours || (rr <= EPS) ? 'Blocked' : g.eta_months != null && g.eta_months > 24 ? 'At risk' : 'On track'
                const why = !g.target_hours
                    ? 'Set a target (hours or amount)'
                    : rr <= EPS
                        ? 'Increase net savings rate (hours/month)'
                        : g.needsHourlyRate
                            ? 'Add hourly rate to convert money to hours'
                            : ''
                return {
                    id: g.goal_id,
                    targetH: g.target_hours,
                    progressH: g.progress_hours,
                    remainingH: g.remaining_hours,
                    eta: g.eta_months,
                    needsRate: !!g.needsHourlyRate,
                    status,
                    why,
                }
            })
            .sort((a, b) => {
                if (a.eta == null && b.eta == null) return 0
                if (a.eta == null) return 1
                if (b.eta == null) return -1
                return a.eta - b.eta
            })
    }, [agg])

    const coverageRatio = useMemo(() => {
        if (!agg?.timeCostHours || !agg?.timeSavingsHours) return null
        const sum = (s: Record<string, number> | null) =>
            months.reduce((t, m) => t + (s?.[m] ?? 0), 0)
        const cost = sum(agg.timeCostHours)
        const save = sum(agg.timeSavingsHours)
        return cost > 0 ? save / cost : null
    }, [agg, months])

    const consistency = useMemo(() => {
        const vals = months
            .map(m => agg?.timeBurnNet?.[m])
            .filter((v): v is number => typeof v === 'number');

        if (vals.length < 2) return null;

        const mean = vals.reduce((a,b)=>a+b,0) / vals.length;
        const denom = vals.length - 1;
        const sd = Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0) / denom);

        if (!isFinite(sd) || sd === 0) return null;
        return mean / sd;
    }, [agg, months]);


    const zFlags = useMemo(() => {
        const xs = months.map(m => ({ m, v: agg?.timeBurnNet?.[m] ?? 0 }))
        if (!xs.length) return { best: null as any, worst: null as any }
        const best = xs.reduce((a,b)=> (b.v < a.v ? b : a))
        const worst = xs.reduce((a,b)=> (b.v > a.v ? b : a))
        return { best, worst }
    }, [agg, months])

    const fmtPct = (x: number | null) => x == null ? '—' : `${(x*100).toFixed(0)}%`

    const roll3Net = useMemo(() => {
        const v = months.map(m => agg?.timeBurnNet?.[m] ?? 0)
        return v.map((_, i) => i < 2 ? null : (v[i] + v[i-1] + v[i-2]) / 3)
    }, [agg, months])

    const categoryPareto = useMemo(() => {
        const cost = agg?.costByCategoryHours ?? {}
        const save = agg?.savingsByCategoryHours ?? {}
        const ids = new Set<number>([
            ...Object.keys(cost).map(Number),
            ...Object.keys(save).map(Number),
        ])
        return [...ids].map(id => {
            const total = months.reduce((t, m) =>
                t + (cost[id]?.[m] ?? 0) - (save[id]?.[m] ?? 0), 0)
            return {id, label: `Cat ${id}`, total}
        }).sort((a, b) => b.total - a.total)
    }, [agg, months])

    const wfData = useMemo(() => {
        if (!agg) return []
        const m = currentMonth
        return [
            { label: 'Expenses',         v:  agg.expenseHours?.[m] ?? 0 },
            { label: 'Maintenance',      v:  agg.objectsMaintHours?.[m] ?? 0 },
            { label: 'Activity extra',   v:  agg.activitiesExtraCostHours?.[m] ?? 0 },
            { label: 'Capex amort.',     v:  agg.objectsCapexHours?.[m] ?? 0 },
            { label: 'Objects saved',    v: -(agg.objectsSavedHours?.[m] ?? 0) },
            { label: 'Activities saved', v: -(agg.activitiesSavedHours?.[m] ?? 0) },
        ]
    }, [agg, currentMonth])

    const deltaByComponent = useMemo(() => {
        if (!prevMonth || !agg) return null
        const diff = (s: Record<string, number> | null | undefined) =>
            (s?.[currentMonth] ?? 0) - (s?.[prevMonth] ?? 0)

        return {
            Net: diff(agg.timeBurnNet ?? null),
            Expenses: diff(agg.expenseHours ?? null),
            Maintenance: diff(agg.objectsMaintHours ?? null),
            'Activity extra': diff(agg.activitiesExtraCostHours ?? null),
            'Capex amort.': diff(agg.objectsCapexHours ?? null),
            'Objects saved': -(diff(agg.objectsSavedHours ?? null)),
            'Activities saved': -(diff(agg.activitiesSavedHours ?? null)),
        }
    }, [agg, currentMonth, prevMonth])

    const topDrivers = useMemo(() => {
        if (!deltaByComponent) return []
        return Object.entries(deltaByComponent)
            .filter(([k]) => k !== 'Net')
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 3)
            .map(([label, v]) => ({ label, v }))
    }, [deltaByComponent])

    const topMoversCats = useMemo(() => {
        if (!agg || !prevMonth) return []
        const cost = agg.costByCategoryHours ?? {}
        const save = agg.savingsByCategoryHours ?? {}
        const ids = new Set<number>([
            ...Object.keys(cost).map(Number),
            ...Object.keys(save).map(Number),
        ])

        const curNet = (id: number) =>
            (cost[id]?.[currentMonth] ?? 0) - (save[id]?.[currentMonth] ?? 0)
        const prevNet = (id: number) =>
            (cost[id]?.[prevMonth] ?? 0) - (save[id]?.[prevMonth] ?? 0)

        return [...ids]
            .map((id) => ({
                id,
                label: `Cat ${id}`,
                delta: curNet(id) - prevNet(id),
                now: curNet(id),
            }))
            .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
            .slice(0, 5)
    }, [agg, currentMonth, prevMonth])

    const runway = useMemo(() => {
        if (!agg || !months.length) return null
        const cum = (months.map((mk) => agg.timeBurnNet?.[mk] ?? 0)
            .reduce((a, v) => a + v, 0))
        const recentAvg = roll3Net[roll3Net.length - 1] ?? null

        if (recentAvg == null || Math.abs(recentAvg) < EPS) {
            return { label: 'No trend yet', months: null, direction: 0 }
        }
        if (cum > 0 && recentAvg < 0) {
            return { label: 'Breakeven in', months: cum / -recentAvg, direction: -1 }
        }
        if (cum <= 0 && recentAvg < 0) {
            return { label: 'Ahead by ~', months: Math.abs(cum) / -recentAvg, direction: -1 }
        }
        return { label: 'Moving away (avg +/mo)', months: null, direction: 1, perMonth: recentAvg }
    }, [agg, months, roll3Net])

    const recommendations = useMemo(() => {
        const out: string[] = []

        const worstCat = categoryPareto.find((c) => c.total > EPS)
        if (worstCat && agg?.costByCategoryHours) {
            const cur = agg.costByCategoryHours[worstCat.id]?.[currentMonth] ?? 0
            const save10 = cur * 0.10
            out.push(`Reduce ${worstCat.label} by 10% → ~${fmtHours(save10)} saved/mo`)
        }

        const bestAct = agg?.activitiesRoi
            ?.slice()
            ?.sort((a, b) => (b.roi_ratio ?? -Infinity) - (a.roi_ratio ?? -Infinity))
            ?.find((a) => (a.net_hours_per_occurrence ?? 0) > EPS)
        if (bestAct) {
            out.push(`Do more of “${bestAct.name ?? `Activity #${bestAct.id}`}`
                + `” → +${fmtHours(bestAct.net_hours_per_occurrence ?? 0)} each time`)
        }

        const riskyObj = agg?.objectsMetrics
            ?.find((o) => (o.payback_months == null || (o.payback_months ?? 0) > 24)
                && (o.lifetime_roi_hours ?? 0) <= 0)
        if (riskyObj) {
            out.push(`Review “${riskyObj.name ?? `Object #${riskyObj.id}`}`
                + `” (payback ${riskyObj.payback_months != null ? `${riskyObj.payback_months.toFixed(1)} mo` : 'unknown'}, ROI ≤ 0h)`)
        }

        return out.slice(0, 3)
    }, [agg, categoryPareto, currentMonth])

    const forecast = useMemo(() => {
        const labels = agg?.forecastLabels ?? months;
        const histLen = months.length;

        const x = { scaleType: 'point' as const, data: labels.map(mk => dayjs(mk + '-01').format('MMM')) };

        const actual = labels.map((_, i) =>
            i < histLen ? (agg?.timeBurnNet?.[months[i]] ?? null) : null
        );

        const predicted = agg?.forecastNet
            ? agg.forecastNet.map((v, i) => (i >= histLen ? v : null))
            : labels.map(() => null);

        return { x, actual, predicted, histLen };
    }, [agg, months]);

    const control = useMemo(() => {
        const vals = months
            .map(m => agg?.timeBurnNet?.[m])
            .filter((v): v is number => typeof v === 'number');

        if (vals.length < 2) {
            const mean = vals[0] ?? 0;
            return { mean, sd: 0, warnU: mean, warnL: mean, alertU: mean, alertL: mean, anomalies: [] as any[] };
        }

        const mean = vals.reduce((a,b)=>a+b,0) / vals.length;
        const sd = Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0) / (vals.length - 1));

        if (!isFinite(sd) || sd < 1e-9) {
            return { mean, sd, warnU: mean, warnL: mean, alertU: mean, alertL: mean, anomalies: [] as any[] };
        }

        const warnU = mean + 1.5 * sd, warnL = mean - 1.5 * sd;
        const alertU = mean + 2 * sd,   alertL = mean - 2 * sd;

        const anomalies = months
            .map((m) => {
                const v = agg?.timeBurnNet?.[m];
                if (v == null) return null;
                const d = Math.abs(v - mean);
                return d > 2 * sd ? { month: m, v, level: 'alert' as const }
                    : d > 1.5 * sd ? { month: m, v, level: 'warn'  as const }
                        : null;
            })
            .filter(Boolean) as { month: string; v: number; level: 'warn' | 'alert' }[];

        return { mean, sd, warnU, warnL, alertU, alertL, anomalies };
    }, [agg, months]);

    const controlSeries = useMemo(() => {
        if (!control) return []
        const line = (v: number) => months.map(() => v)
        return [
            { label: 'Warn +',  data: line(control.warnU),  color: theme.palette.warning.light, showMark: false },
            { label: 'Warn −',  data: line(control.warnL),  color: theme.palette.warning.light, showMark: false },
            { label: 'Alert +', data: line(control.alertU), color: theme.palette.error.light,   showMark: false },
            { label: 'Alert −', data: line(control.alertL), color: theme.palette.error.light,   showMark: false },
        ]
    }, [control, months, theme.palette])

    const anomalySeries = useMemo(() => {
        if (!control) return []
        const is = (lvl: 'warn' | 'alert') =>
            months.map((m) => {
                const hit = control.anomalies.find((a) => a.month === m && a.level === lvl)
                return hit ? (agg?.timeBurnNet?.[m] ?? null) : null
            })
        return [
            { label: 'Anomaly (warn)',  data: is('warn'),  color: theme.palette.warning.main, showMark: true },
            { label: 'Anomaly (alert)', data: is('alert'), color: theme.palette.error.main,   showMark: true },
        ]
    }, [control, months, agg, theme.palette])

    const reqNext = useMemo(() => {
        const histLen = months.length;
        if (!histLen) return null;

        let nextNet: number | null = null;
        let basis: 'forecast' | 'roll3' | 'last' | null = null;

        if (Array.isArray(agg?.forecastNet) && agg!.forecastNet.length > histLen) {
            nextNet = agg!.forecastNet[histLen];
            basis = 'forecast';
        } else {
            const r3 = roll3Net[roll3Net.length - 1];
            if (r3 != null) {
                nextNet = r3 as number;
                basis = 'roll3';
            } else {
                const last = agg?.timeBurnNet?.[months[histLen - 1]];
                if (typeof last === 'number') {
                    nextNet = last;
                    basis = 'last';
                }
            }
        }

        if (nextNet == null) return null;

        const reqH = Math.max(0, nextNet);
        const rate = settings.hourlyRate as number | null;
        const reqMoney = rate ? reqH * rate : null;

        const nextMonthName = dayjs(months[histLen - 1] + '-01').add(1, 'month').format('MMM YYYY');

        return { nextNet, reqH, reqMoney, nextMonthName, basis };
    }, [agg, months, roll3Net, settings.hourlyRate]);


    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">Failed to load data: {String(error)}</Alert>
            </Box>
        )
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Welcome back
                    </Typography>
                    <Typography color="text.secondary">
                        A richer view of your time ↔ money engine.
                    </Typography>
                </Box>

                {isLoading && <LinearProgress />}

                <Stack direction="row" spacing={1}>
                    <Chip
                        label="Hours"
                        color={view === 'hours' ? 'primary' : 'default'}
                        variant={view === 'hours' ? 'filled' : 'outlined'}
                        onClick={() => setView('hours')}
                    />
                    <Chip
                        label="Money"
                        color={view === 'money' ? 'primary' : 'default'}
                        variant={view === 'money' ? 'filled' : 'outlined'}
                        onClick={() => setView('money')}
                    />
                </Stack>

                {view === 'hours' && (
                    <>
                        {/* Top tiles (time) */}
                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Explain
                                    label="Net time burn (this month)"
                                    what="Net time burn = time costs − time savings (hours). Lower or negative is better."
                                    how="Computed as timeBurnNet[m] = (expense + maintenance + activity extra + capex amort.) − (objects saved + activities saved) for the current month."
                                >
                                    <Paper sx={TILE_SX}>
                                        <Typography variant="subtitle2" color="text.secondary">This month — Net time burn</Typography>
                                        <Typography variant="h5" fontWeight={700}>{fmtHours(topTiles.net)}</Typography>
                                        <Typography variant="caption" color="text.secondary">{dayjs(currentMonth + '-01').format('MMMM YYYY')}</Typography>
                                        {topTiles.mom != null && (
                                            <Typography variant="caption" color={topTiles.mom > 0 ? 'error.main' : 'success.main'}>
                                                {topTiles.mom > 0 ? '▲' : '▼'} MoM {fmtHours(Math.abs(topTiles.mom))}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Explain
                                    title="Time costs (this month)"
                                    what="Total hours spent on cost drivers this month."
                                    how="Costs = expenseHours + objectsMaintHours + activitiesExtraCostHours + objectsCapexHours (hours)."
                                >
                                    <Paper sx={TILE_SX}>
                                        <Typography variant="subtitle2" color="text.secondary">This month — Time costs</Typography>
                                        <Typography variant="h5" fontWeight={700}>{fmtHours(topTiles.cost)}</Typography>
                                    </Paper>
                                </Explain>
                            </Grid>


                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Explain
                                    title="Time savings (this month)"
                                    what="Total hours saved this month from objects and activities."
                                    how="Savings = objectsSavedHours + activitiesSavedHours (hours)."
                                >
                                    <Paper sx={TILE_SX}>
                                        <Typography variant="subtitle2" color="text.secondary">This month — Time savings</Typography>
                                        <Typography variant="h5" fontWeight={700}>{fmtHours(topTiles.savings)}</Typography>
                                    </Paper>
                                </Explain>
                            </Grid>


                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Explain
                                    title="Avg net per month (period)"
                                    what="Average monthly net time burn across the selected months. ≤ 0 means you’re net saving time on average."
                                    how="Avg = Σ timeBurnNet[m] ÷ number of months, where timeBurnNet = Costs − Savings. ‘Good months’ = share of months with net ≤ 0; ‘Streak’ = consecutive good months ending now."
                                >
                                    <Paper sx={TILE_SX}>
                                        <Typography variant="subtitle2" color="text.secondary">Avg net per month (period)</Typography>
                                        <Typography variant="h5" fontWeight={700}>{fmtHours(agg?.netSavingsHoursPerMonth ?? 0)}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {`Good months: ${(topTiles.goodShare * 100).toFixed(0)}% · Streak: ${topTiles.streak} mo`}
                                        </Typography>
                                        {!settings.hourlyRate && (
                                            <Chip size="small" color="warning" label="Add hourly rate to see money value" sx={{ mt: 1, width: 'fit-content' }} />
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                        </Grid>


                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Explain
                                    title="Costs vs Savings vs Net"
                                    what="Monthly totals in hours. Net = Costs − Savings. The 3-month line smooths noise; bands mark statistical thresholds; dots mark anomalies."
                                    how="Costs = expense + maintenance + activity extra + capex amort. Savings = objects + activities saved. ‘Net (3-mo avg)’ = simple moving average. Warn/Alert bands = mean ± (1.5σ / 2σ). Anomaly if |value − mean| exceeds the band."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Costs vs Savings vs Net</Typography>
                                        <LineChart
                                            xAxis={[xMonths]}
                                            series={[
                                                ...(trendSeries as any),
                                                { label: 'Net (3-mo avg)', data: roll3Net },
                                                ...(controlSeries as any),
                                                ...(anomalySeries as any),
                                            ]}
                                            slotProps={{ legend: { hidden: ['Warn +','Warn −','Alert +','Alert −'] } }}
                                            height={CHART_H}
                                            margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                            grid={{ vertical: true, horizontal: true }}
                                        />
                                        {control?.anomalies?.length ? (
                                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                                {control.anomalies.map((a) => (
                                                    <Chip
                                                        key={a.month + a.level}
                                                        size="small"
                                                        variant="outlined"
                                                        color={a.level === 'alert' ? 'error' : 'warning'}
                                                        label={`${dayjs(a.month + '-01').format('MMM YY')}: ${fmtHours(a.v)} ${a.level}`}
                                                    />
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">No anomalies in this window.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Stack spacing={2} sx={{ height: '100%' }}>
                                    <Explain
                                        title="Required change next month"
                                        what="Target improvement needed next month to reach ≤ 0 net time burn."
                                        how="We estimate next month’s net as: forecast[+1] if available; otherwise 3-month rolling average; otherwise last month. Required hours = max(0, nextNet). If an hourly rate is set, we also show the money equivalent (required × rate)."
                                    >
                                        <Paper sx={{ ...TILE_SX, flex: 1 }}>
                                            <Typography variant="subtitle1" gutterBottom>Required change next month</Typography>
                                            {reqNext ? (
                                                <Stack spacing={0.5}>
                                                    <Typography fontWeight={700}>
                                                        {reqNext.reqH > 0 ? `Improve ~${fmtHours(reqNext.reqH)}` : 'On pace for ≤ 0'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Target for {reqNext.nextMonthName} · {
                                                        reqNext.basis === 'forecast' ? 'Forecast' :
                                                            reqNext.basis === 'roll3'   ? '3-mo avg' :
                                                                'Last month'
                                                    }
                                                    </Typography>
                                                    {reqNext.reqH > 0 && reqNext.reqMoney != null && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            ≈ {new Intl.NumberFormat(undefined, { style: 'currency', currency: settings.userCurrency, maximumFractionDigits: 0 }).format(reqNext.reqMoney)}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            ) : (
                                                <Typography color="text.secondary">Not enough data for next-month target.</Typography>
                                            )}
                                        </Paper>
                                    </Explain>

                                    <Explain
                                        title="Breakeven & runway"
                                        what="How long until breakeven or how far ahead you are, using the recent trend."
                                        how="Compute the 3-month average of net (recentAvg). If recentAvg ≈ 0 → 'No trend'. If cumulative net > 0 and recentAvg < 0 → 'Breakeven in' = cumulative / -recentAvg months. If cumulative ≤ 0 and recentAvg < 0 → 'Ahead by' = |cumulative| / -recentAvg months. Otherwise 'Moving away' with average monthly change = recentAvg."
                                    >
                                        <Paper sx={{ ...TILE_SX, flex: 1 }}>
                                            <Typography variant="subtitle1" gutterBottom>Breakeven & runway</Typography>
                                            {!runway ? (
                                                <Typography color="text.secondary">Not enough data.</Typography>
                                            ) : runway.months != null ? (
                                                <Stack>
                                                    <Typography fontWeight={700}>{runway.label} ~{runway.months.toFixed(1)} mo</Typography>
                                                    <Typography variant="caption" color="text.secondary">Based on 3-month average net.</Typography>
                                                </Stack>
                                            ) : runway.direction > 0 ? (
                                                <Stack>
                                                    <Typography color="error.main" fontWeight={700}>{runway.label} {fmtHours(runway.perMonth ?? 0)}</Typography>
                                                    <Typography variant="caption" color="text.secondary">Net time burn is increasing on average.</Typography>
                                                </Stack>
                                            ) : (
                                                <Typography color="text.secondary">Trend not conclusive yet.</Typography>
                                            )}
                                        </Paper>
                                    </Explain>

                                    <Explain
                                        title="What changed vs last month"
                                        what="Month-over-month change in net and its drivers."
                                        how="For each component, Δ = current − previous: expenses, maintenance, activity extra, capex amortization, objects saved (negated), activities saved (negated). Net Δ is the sum of components."
                                    >
                                        <Paper sx={{ ...TILE_SX, flex: 1 }}>
                                            <Typography variant="subtitle1" gutterBottom>What changed vs last month</Typography>
                                            {!prevMonth || !deltaByComponent ? (
                                                <Typography color="text.secondary">Need at least 2 months of data.</Typography>
                                            ) : (
                                                <Stack spacing={0.5}>
                                                    <Typography fontWeight={700}>
                                                        Net: {fmtHours(deltaByComponent.Net ?? 0)} {deltaByComponent.Net! > 0 ? '▲' : '▼'}
                                                    </Typography>
                                                    {topDrivers.map((d) => (
                                                        <Typography key={d.label} variant="body2" color={d.v > 0 ? 'error.main' : 'success.main'}>
                                                            {d.v > 0 ? '▲' : '▼'} {d.label}: {fmtHours(Math.abs(d.v))}
                                                        </Typography>
                                                    ))}
                                                    {!!topMoversCats.length && (
                                                        <>
                                                            <Divider sx={{ my: 1 }} />
                                                            <Typography variant="caption" color="text.secondary">Top category movers:</Typography>
                                                            {topMoversCats.map((c) => (
                                                                <Typography key={c.id} variant="body2" color={c.delta > 0 ? 'error.main' : 'success.main'}>
                                                                    {c.delta > 0 ? '▲' : '▼'} {c.label}: {fmtHours(Math.abs(c.delta))}
                                                                </Typography>
                                                            ))}
                                                        </>
                                                    )}
                                                </Stack>
                                            )}
                                        </Paper>
                                    </Explain>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title={`Net breakdown — ${dayjs(currentMonth + '-01').format('MMMM YYYY')}`}
                                    what="One-month components that build up the net time burn."
                                    how="Net = +expenses +maintenance +activity extra +capex amortization −objects saved −activities saved for the selected month."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Net breakdown — {dayjs(currentMonth + '-01').format('MMMM YYYY')}
                                        </Typography>
                                        {wfData.length ? (
                                            <BarChart
                                                xAxis={[{ scaleType: 'band', data: wfData.map(d => d.label) }]}
                                                series={[{ data: wfData.map(d => d.v) }]}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : <Typography color="text.secondary">No data.</Typography>}
                                        <Typography variant="caption" color="text.secondary">
                                            Positive bars increase time burn; negative bars reduce it.
                                        </Typography>
                                    </Paper>
                                </Explain>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Cumulative net (hours)"
                                    what="Running total of net time burn across the selected period."
                                    how="cum[i] = Σ (timeBurnNet[k]) for k ≤ i. Shows whether you’re trending toward or away from breakeven overall."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Cumulative net (hours)</Typography>
                                        <LineChart
                                            xAxis={[xMonths]}
                                            series={[{ label: 'Cumulative net', data: cumNetSeries, color: theme.palette.primary.main }]}
                                            height={CHART_H}
                                            margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                            grid={{ vertical: true, horizontal: true }}
                                        />
                                    </Paper>
                                </Explain>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Net — 3-month forecast"
                                    what="Projected net time burn for the next months alongside history."
                                    how="History uses timeBurnNet for past months. Forecast uses forecastNet values aligned to forecastLabels (or months). Only future points are shown as 'forecast'."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Net — 3-month forecast</Typography>
                                        <LineChart
                                            xAxis={[forecast.x]}
                                            series={[
                                                { label: 'Net (actual)', data: forecast.actual },
                                                { label: 'Net (forecast)', data: forecast.predicted },
                                            ]}
                                            height={CHART_H}
                                            margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                            grid={{ vertical: true, horizontal: true }}
                                        />
                                        {agg?.projectedBreakevenMonth != null && (
                                            <Typography variant="caption" color="text.secondary">
                                                Projected breakeven: {dayjs(agg.projectedBreakevenMonth + '-01').format('MMM YYYY')}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Category Pareto (net hours, period)"
                                    what="Which categories drive the most net time burn (or savings) across the selected period."
                                    how="For each category: total = Σ(costByCategoryHours[id][m] − savingsByCategoryHours[id][m]). Sorted descending; positive = burn, negative = net savings."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Category Pareto (net hours, period)</Typography>
                                        {categoryPareto.length ? (
                                            <BarChart
                                                xAxis={[{ scaleType: 'linear' as const }]}
                                                yAxis={[{ scaleType: 'band' as const, data: categoryPareto.slice(0, 8).map(c => c.label) }]}
                                                series={[{ data: categoryPareto.slice(0, 8).map(c => c.total) }]}
                                                layout="horizontal"
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 100 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : <Typography color="text.secondary">No category data yet.</Typography>}
                                        <Typography variant="caption" color="text.secondary">Positive = higher net burn; negative = net savings.</Typography>
                                    </Paper>
                                </Explain>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Cost composition (stacked)"
                                    what="Monthly breakdown of time costs by source."
                                    how="Costs per month are stacked: expenseHours + objectsMaintHours + activitiesExtraCostHours + objectsCapexHours."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Cost composition (stacked)</Typography>
                                        {stackedCost ? (
                                            <BarChart
                                                xAxis={[stackedCost.x]}
                                                series={stackedCost.series}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : <Typography color="text.secondary">No cost data.</Typography>}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Savings mix (stacked)"
                                    what="Monthly breakdown of time savings by source."
                                    how="Savings per month are stacked: objectsSavedHours + activitiesSavedHours."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Savings mix (stacked)</Typography>
                                        {stackedSavings ? (
                                            <BarChart
                                                xAxis={[stackedSavings.x]}
                                                series={stackedSavings.series}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : <Typography color="text.secondary">No savings data.</Typography>}
                                    </Paper>
                                </Explain>
                            </Grid>

                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs:12, md:4 }}>
                                <Explain
                                    title="Coverage"
                                    what="Share of time costs that are offset by time savings over the period."
                                    how="Coverage = Σ(timeSavingsHours) ÷ Σ(timeCostHours) for the selected months."
                                >
                                    <Paper sx={{ p:3, borderRadius:2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Coverage</Typography>
                                        <Typography variant="h5" fontWeight={700}>{fmtPct(coverageRatio)}</Typography>
                                        <Typography variant="caption" color="text.secondary">Savings as % of costs (period)</Typography>
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs:12, md:4 }}>
                                <Explain
                                    title="Consistency (μ/σ)"
                                    what="How steady your net time burn is across months (higher is steadier)."
                                    how="Compute mean (μ) and sample standard deviation (σ) of monthly timeBurnNet. Consistency = μ ÷ σ. Requires ≥ 2 months; undefined if σ ≈ 0."
                                >
                                    <Paper sx={{ p:3, borderRadius:2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Consistency (μ/σ)</Typography>
                                        <Typography variant="h5" fontWeight={700}>{consistency == null ? '—' : consistency.toFixed(2)}</Typography>
                                        <Typography variant="caption" color="text.secondary">Higher = steadier net across months</Typography>
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs:12, md:4 }}>
                                <Explain
                                    title="Best & Worst month"
                                    what="The months with the lowest (best) and highest (worst) net time burn in the window."
                                    how="Scan monthly timeBurnNet; 'Best' = min value; 'Worst' = max value."
                                >
                                    <Paper sx={{ p:3, borderRadius:2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Best & Worst month</Typography>
                                        <Stack direction="row" spacing={2}>
                                            <Stack>
                                                <Typography variant="body2" color="text.secondary">Best</Typography>
                                                <Typography fontWeight={700}>
                                                    {zFlags.best ? `${dayjs(zFlags.best.m+'-01').format('MMM YY')} · ${fmtHours(zFlags.best.v)}` : '—'}
                                                </Typography>
                                            </Stack>
                                            <Stack>
                                                <Typography variant="body2" color="text.secondary">Worst</Typography>
                                                <Typography fontWeight={700}>
                                                    {zFlags.worst ? `${dayjs(zFlags.worst.m+'-01').format('MMM YY')} · ${fmtHours(zFlags.worst.v)}` : '—'}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                </Explain>
                            </Grid>

                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Explain
                                    title="Budget vs Actual (hours)"
                                    what="Compares planned (Budget) vs realized (Actual) hours across months, plus the biggest category variances."
                                    how="Budget series = agg.budgetHours[m]. Actual series = agg.budgetHours[m] − agg.budgetVarianceHoursByMonth[m].
                                        Top variances use agg.budgetVarianceByCategoryHours: total variance per category is Σ (budget − actual) over the selected period (positive = under budget, negative = over)."
                                >
                                    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                        <Typography variant="subtitle1" gutterBottom>Budget vs Actual (hours)</Typography>
                                        {budgetVsActual ? (
                                            <LineChart
                                                xAxis={[budgetVsActual.x]}
                                                series={budgetVsActual.series}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No budgets in this period.</Typography>
                                        )}

                                        {!!topBudgetVariances.length && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle2" gutterBottom>Top variances (period total)</Typography>
                                                <BarChart
                                                    xAxis={[{ scaleType: 'linear' as const }]}
                                                    yAxis={[{ scaleType: 'band' as const, data: topBudgetVariances.map((t) => t.label) }]}
                                                    series={[{ data: topBudgetVariances.map((t) => t.total) }]}
                                                    layout="horizontal"
                                                    height={CHART_H}
                                                    margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    Variance = Budget − Actual (positive = under; negative = over).
                                                </Typography>
                                            </>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex' }}>
                                <Stack spacing={2} sx={{ flex: 1, minHeight: 1 }} justifyContent="space-between">
                                    <Explain
                                        title="Time to goal"
                                        what="Estimated months to reach each goal, based on your current average net savings rate (hours/month)."
                                        how="From agg.goalsProgress: remaining_hours and eta_months per goal. Status logic in UI:
                                            • Blocked if no target_hours or netSavingsHoursPerMonth ≤ 0 (or needs hourly rate for money-based goals).
                                            • At risk if eta_months > 24.
                                            • On track otherwise."
                                    >
                                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom>Time to goal</Typography>
                                            {goalsList.length ? (
                                                <Stack divider={<Divider flexItem />}>
                                                    {goalsList.slice(0, 6).map((g) => (
                                                        <Stack key={g.id} direction="row" alignItems="center" justifyContent="space-between" py={0.5}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography fontWeight={600}>Goal #{g.id}</Typography>
                                                                <Chip
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color={g.status === 'On track' ? 'success' : g.status === 'At risk' ? 'warning' : 'default'}
                                                                    label={g.status}
                                                                />
                                                            </Stack>
                                                            <Stack direction="row" spacing={3}>
                                                                <Typography variant="body2" color="text.secondary">Remaining: {fmtHours(g.remainingH ?? 0)}</Typography>
                                                                <Typography variant="body2" color="text.secondary">ETA: {g.eta != null ? `${g.eta.toFixed(1)} mo` : '—'}</Typography>
                                                            </Stack>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            ) : (
                                                <Typography color="text.secondary">No goals yet.</Typography>
                                            )}
                                            {goalsList.some((g) => g.status !== 'On track' && g.why) && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                    Tip: {goalsList.find((g) => g.status !== 'On track' && g.why)?.why}
                                                </Typography>
                                            )}
                                        </Paper>
                                    </Explain>

                                    <Explain
                                        title="Suggested next steps"
                                        what="Actionable suggestions based on your biggest driver, your best activity ROI, and any risky objects."
                                        how="Built from:
                                            • categoryPareto[0] → suggest −10% on that category (hours saved ≈ 10% of current month’s cost there).
                                            • activitiesRoi → pick highest roi_ratio with positive net_hours_per_occurrence.
                                            • objectsMetrics → flag items with payback_months unknown/>24 and lifetime_roi_hours ≤ 0."
                                    >
                                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom>Suggested next steps</Typography>
                                            {recommendations.length ? (
                                                <Stack spacing={0.5}>
                                                    {recommendations.map((r, i) => (
                                                        <Typography key={i} variant="body2">• {r}</Typography>
                                                    ))}
                                                </Stack>
                                            ) : (
                                                <Typography color="text.secondary">No suggestions right now.</Typography>
                                            )}
                                        </Paper>
                                    </Explain>

                                    <Explain
                                        title="Activities — ROI"
                                        what="Top activities by ROI with their net hours per occurrence."
                                        how="Uses agg.activitiesRoi, sorted by roi_ratio (desc). Displays roi_ratio and net_hours_per_occurrence as provided by the engine (positive net means time saved after costs)."
                                    >
                                        <Paper sx={{ p: 3, borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="subtitle1" gutterBottom>Activities — ROI</Typography>
                                            {agg?.activitiesRoi?.length ? (
                                                <Stack divider={<Divider flexItem />}>
                                                    {agg.activitiesRoi
                                                        .slice()
                                                        .sort((a, b) => (b.roi_ratio ?? -Infinity) - (a.roi_ratio ?? -Infinity))
                                                        .slice(0, 6)
                                                        .map((r, i) => (
                                                            <Stack key={`${r.id}-${i}`} direction="row" justifyContent="space-between">
                                                                <Typography>{r.name ?? `Activity #${r.id ?? i + 1}`}</Typography>
                                                                <Typography color="text.secondary">
                                                                    ROI: {r.roi_ratio != null ? r.roi_ratio.toFixed(2) : '—'} · Net/occ: {fmtHours(r.net_hours_per_occurrence ?? 0)}
                                                                </Typography>
                                                            </Stack>
                                                        ))}
                                                </Stack>
                                            ) : (
                                                <Typography color="text.secondary">No activity ROI yet.</Typography>
                                            )}
                                        </Paper>
                                    </Explain>

                                    <Explain
                                        title="Objects — payback & lifetime ROI"
                                        what="Objects ranked by fastest payback with total lifetime time ROI."
                                        how="Uses agg.objectsMetrics: displays payback_months (smaller is better; ‘—’ if unknown) and lifetime_roi_hours. Items with very long/unknown payback and ≤ 0 lifetime ROI may be risky."
                                    >
                                        <Paper sx={{ p: 3, borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="subtitle1" gutterBottom>Objects — payback & lifetime ROI</Typography>
                                            {agg?.objectsMetrics?.length ? (
                                                <Stack divider={<Divider flexItem />}>
                                                    {agg.objectsMetrics
                                                        .slice()
                                                        .sort((a, b) => (a.payback_months ?? Infinity) - (b.payback_months ?? Infinity))
                                                        .slice(0, 6)
                                                        .map((o, i) => (
                                                            <Stack key={`${o.id}-${i}`} direction="row" justifyContent="space-between">
                                                                <Typography>{o.name ?? `Object #${o.id ?? i + 1}`}</Typography>
                                                                <Typography color="text.secondary">
                                                                    Payback: {o.payback_months != null ? `${o.payback_months.toFixed(1)} mo` : '—'} · Lifetime ROI: {fmtHours(o.lifetime_roi_hours ?? 0)}
                                                                </Typography>
                                                            </Stack>
                                                        ))}
                                                </Stack>
                                            ) : (
                                                <Typography color="text.secondary">No object metrics yet.</Typography>
                                            )}
                                        </Paper>
                                    </Explain>
                                </Stack>
                            </Grid>
                        </Grid>
                    </>
                )}

                {view === 'money' && (
                    <>
                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Explain
                                    title="Net money (this month)"
                                    what="Income minus Expenses for the current month. Positive = surplus; negative = deficit."
                                    how="Income = Σ income entries; Expenses = Σ expense entries for the month. Net money = Income − Expenses."
                                >
                                    <Paper sx={TILE_SX}>
                                        <Typography variant="subtitle2" color="text.secondary">This month — Net money</Typography>
                                        <Typography variant="h5" fontWeight={700}>{fmtMoney(moneyKpis?.net ?? 0)}</Typography>
                                        {moneyKpis?.mom != null && (
                                            <Typography variant="caption" color={moneyKpis.mom >= 0 ? 'success.main' : 'error.main'}>
                                                {moneyKpis.mom >= 0 ? '▲' : '▼'} MoM {fmtMoney(Math.abs(moneyKpis.mom))}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Explain
                                    title="Savings rate (money)"
                                    what="Share of income left after expenses this month."
                                    how="Savings rate = Net money ÷ Income. Only defined if Income > 0."
                                >
                                    <Paper sx={TILE_SX}>
                                        <Typography variant="subtitle2" color="text.secondary">Savings rate</Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            {moneyKpis?.sRate != null ? `${(moneyKpis.sRate * 100).toFixed(0)}%` : '—'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Net / Income (this month)</Typography>
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Explain
                                    title="All-in net (money + time)"
                                    what="Money net adjusted for the value of your net time burn."
                                    how="All-in net = Net money − (Net time burn × hourly rate). Requires an hourly rate."
                                >
                                    <Paper sx={TILE_SX}>
                                        <Typography variant="subtitle2" color="text.secondary">All-in net (money + time)</Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            {settings.hourlyRate ? fmtMoney(moneyKpis?.allInNet ?? 0) : '—'}
                                        </Typography>
                                        {!settings.hourlyRate && (
                                            <Chip size="small" color="warning" label="Add hourly rate to enable" sx={{ mt: 1 }} />
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Explain
                                    title="Income concentration"
                                    what="How dependent you are on a few income sources."
                                    how="Herfindahl–Hirschman Index (HHI) = Σ(sᵢ²), where sᵢ is each source’s share of total income (0–1). Higher = more concentrated."
                                >
                                    <Paper sx={TILE_SX}>
                                        <Typography variant="subtitle2" color="text.secondary">Income concentration</Typography>
                                        <Typography variant="h6" fontWeight={700}>
                                            HHI {incomeConcentration ? incomeConcentration.hhi.toFixed(2) : '—'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Top source: {incomeConcentration ? `${incomeConcentration.topLabel} · ${(incomeConcentration.topShare * 100).toFixed(0)}%` : '—'}
                                        </Typography>
                                    </Paper>
                                </Explain>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Explain
                                    title="All-in P&L"
                                    what="Income, expenses, and the resulting net by month."
                                    how="If an hourly rate is set, Expenses include time value (net time × rate) and the net line is All-in net; otherwise pure money net."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>All-in P&L</Typography>
                                        {moneySeries ? (
                                            <LineChart
                                                xAxis={[moneySeries.x]}
                                                series={[
                                                    { label: 'Income', data: moneySeries.income },
                                                    { label: settings.hourlyRate ? 'Expenses + time value' : 'Expenses', data: (moneyDerived?.allInExpense ?? moneySeries.expense) as any },
                                                    ...(settings.hourlyRate
                                                        ? [{ label: 'All-in net', data: moneyDerived?.allInNet as any }]
                                                        : [{ label: 'Net money', data: moneySeries.netMoney as any }]),
                                                ]}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : <Typography color="text.secondary">No data.</Typography>}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Explain
                                    title="Breakeven target (money)"
                                    what="How much you’d need to improve next month to reach non-negative net money."
                                    how="Uses 3-month average of net money (or the latest if not enough history). Needed = max(0, −nextAvgNet)."
                                >
                                    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                        <Typography variant="subtitle1" gutterBottom>Breakeven target (money)</Typography>
                                        {reqNextMoney ? (
                                            <Stack spacing={0.5}>
                                                <Typography fontWeight={700}>
                                                    {reqNextMoney.needed > 0
                                                        ? `Improve ~${fmtMoney(reqNextMoney.needed)} by ${reqNextMoney.nextMonthName}`
                                                        : `On pace for ≥ 0 in ${reqNextMoney.nextMonthName}`}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">Based on 3-mo average of net money.</Typography>
                                            </Stack>
                                        ) : (
                                            <Typography color="text.secondary">Not enough data.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Time → Money coefficient"
                                    what="Estimated change in money for each 1 hour of net time."
                                    how="Simple linear regression over pairs (net time hours, net money). Slope ≈ currency per hour; also shows correlation r."
                                >
                                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Time→Money coeff</Typography>
                                        <Typography variant="h6" fontWeight={700}>
                                            {timeMoneyCoupling ? `${fmtMoney(timeMoneyCoupling.slope)} / hr` : '—'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Corr r: {timeMoneyCoupling ? timeMoneyCoupling.r.toFixed(2) : '—'}
                                        </Typography>
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Efficiency ratio (snapshot)"
                                    what="Expense-to-income ratio for the current month (lower is better)."
                                    how="Efficiency = Expenses ÷ Income. <100% means you’re profitable this month."
                                >
                                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Efficiency ratio</Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            {efficiencyTrend && efficiencyTrend.length
                                                ? `${Math.round((efficiencyTrend[efficiencyTrend.length - 1] ?? 0) * 100)}%`
                                                : '—'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Expenses ÷ Income (this month)</Typography>
                                    </Paper>
                                </Explain>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Cumulative net (money)"
                                    what="Running total of net money across the selected period."
                                    how="cum[i] = Σ netMoney[k] for k ≤ i."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Cumulative net (money)</Typography>
                                        {moneySeries ? (
                                            <LineChart
                                                xAxis={[moneySeries.x]}
                                                series={[{ label: 'Cumulative net', data: cumNetMoney }]}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No data.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Efficiency ratio — trend"
                                    what="Monthly Expenses ÷ Income so you can see direction over time."
                                    how="Undefined for months with zero income; those points are left blank."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Efficiency ratio (Expenses ÷ Income)</Typography>
                                        {efficiencyTrend ? (
                                            <LineChart
                                                xAxis={[moneySeries!.x]}
                                                series={[{ label: 'Exp / Inc', data: efficiencyTrend as any }]}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No data.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Explain
                                    title="Income vs Expenses (money)"
                                    what="Raw inflows and outflows per month."
                                    how="Direct series of Income and Expenses as recorded."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Income vs Expenses (money)</Typography>
                                        {moneySeries ? (
                                            <LineChart
                                                xAxis={[moneySeries.x]}
                                                series={[
                                                    { label: 'Income', data: moneySeries.income },
                                                    { label: 'Expenses', data: moneySeries.expense },
                                                ]}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No data.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Explain
                                    title="Monthly surplus / deficit"
                                    what="Bars show net money for each month."
                                    how="Net money = Income − Expenses."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Monthly surplus / deficit</Typography>
                                        {moneySeries ? (
                                            <BarChart
                                                xAxis={[{ scaleType: 'band', data: months.map((mk) => dayjs(mk + '-01').format('MMM')) }]}
                                                series={[{ label: 'Net money', data: moneySeries.netMoney }]}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No data.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Explain
                                    title="Value of net time (money)"
                                    what="Monetized value of your monthly net time using your hourly rate."
                                    how="Net time × hourly rate; positive means time burn cost, negative means time saved value."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Value of net time (money)</Typography>
                                        {moneySeries?.netTimeValue ? (
                                            <LineChart
                                                xAxis={[moneySeries.x]}
                                                series={[{ label: 'Net time × rate', data: moneySeries.netTimeValue }]}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">Set an hourly rate to see value.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} columns={12} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Savings rate (%) — trend"
                                    what="Monthly money savings rate over time."
                                    how="Net money ÷ Income per month; undefined when income is 0."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Savings rate (%)</Typography>
                                        {moneyDerived ? (
                                            <LineChart
                                                xAxis={[moneySeries!.x]}
                                                series={[{ label: 'Net / Income', data: savingsRateSeries as any }]}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No data.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Explain
                                    title="Income by source (share)"
                                    what="How your total income splits across sources in this period."
                                    how="Totals are summed per source over the selected months, then shown as shares."
                                >
                                    <Paper sx={CHART_CARD_SX}>
                                        <Typography variant="subtitle1" gutterBottom>Income by source (share)</Typography>
                                        {incomeBySourcePie ? (
                                            <PieChart
                                                series={incomeBySourcePie}
                                                height={CHART_H}
                                                margin={{ top: 20, right: 20, bottom: 30, left: 20 }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No income sources.</Typography>
                                        )}
                                    </Paper>
                                </Explain>
                            </Grid>
                        </Grid>
                    </>
                )}
            </Stack>
        </Box>
    )
}