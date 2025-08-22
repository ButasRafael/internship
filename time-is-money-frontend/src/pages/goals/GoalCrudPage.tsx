// src/pages/GoalCrudPage.tsx
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { fx } from '@/lib/fx';
import dayjs from 'dayjs';
import { fmtH, goalTargetInsight, goalProgressInsight, goalEtaMonths } from '@/lib/insights';
import type { AggregateResult } from '@/lib/time-engine';

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const;

type GoalRow = {
    id: number;
    name: string;
    target_amount_cents: number | null;
    target_hours: number | null;
    deadline_date: string | null;
    priority: number;
    status: 'active' | 'paused' | 'done' | 'cancelled';
    currency: string;
};

type ContributionRow = {
    id: number;
    contributed_at: string | null;
    amount_cents: number | null;
    hours: number | null;
    source_type: string;
};

type GoalRowUI = GoalRow & {
    __ins?: {
        targetH: number | null;
        progressH: number;
        remainingH: number | null;
        etaMonths: number | null;
        needsHourlyRate: boolean;
        progressPct: number | null;
    };
};

export default function GoalCrudPage() {
    const user = useAuth((s) => s.user)!;
    const nav = useNavigate();

    const ctx = useMemo(
        () => ({
            userCurrency: user.currency,
            hourlyRate: user.hourly_rate ?? null,
            fx: (from: string, to: string, date: Date) => fx(from, to, date),
        }),
        [user.currency, user.hourly_rate]
    );

    const thisMonth = dayjs().format('YYYY-MM');

    return (
        <GenericCrudPage<GoalRowUI>
            key={`${user.hourly_rate ?? 'NA'}-${user.currency}-${thisMonth}`}
            title="Goals"

            fetchList={async () => {
                const goals = (await apiFetch(`/api/users/${user.id}/goals`)) as GoalRow[];

                // One aggregate call to estimate net savings hours/month (for ETA).
                let netHpm: number | null | undefined = null;
                try {
                    const agg = (await apiFetch(
                        `/api/users/${user.id}/aggregate?from=${thisMonth}&to=${thisMonth}`
                    )) as AggregateResult;
                    netHpm = agg?.netSavingsHoursPerMonth ?? null;
                } catch {
                    netHpm = null;
                }

                // Compute insights per goal (progress requires its contributions).
                return await Promise.all(
                    goals.map(async (g) => {
                        const contribs = (await apiFetch(
                            `/api/users/${user.id}/goals/${g.id}/contributions`
                        )) as ContributionRow[];

                        const tgt = await goalTargetInsight(
                            {
                                target_amount_cents: g.target_amount_cents,
                                target_hours: g.target_hours,
                                currency: g.currency,
                            },
                            ctx
                        );

                        const prog = await goalProgressInsight(contribs, g.currency, ctx);

                        const remainingH =
                            tgt.targetH == null ? null : Math.max(0, tgt.targetH - prog.progressH);

                        const etaMonths = goalEtaMonths(remainingH, netHpm);

                        const progressPct =
                            tgt.targetH && tgt.targetH > 0
                                ? Math.min(100, Math.max(0, (prog.progressH / tgt.targetH) * 100))
                                : null;

                        return {
                            ...g,
                            __ins: {
                                targetH: tgt.targetH,
                                progressH: prog.progressH,
                                remainingH,
                                etaMonths,
                                needsHourlyRate: tgt.needsHourlyRate || prog.needsHourlyRate,
                                progressPct,
                            },
                        } as GoalRowUI;
                    })
                );
            }}

            createItem={(data) =>
                apiFetch(`/api/users/${user.id}/goals`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            updateItem={(id, data) =>
                apiFetch(`/api/users/${user.id}/goals/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            deleteItem={(id) =>
                apiFetch(`/api/users/${user.id}/goals/${id}`, { method: 'DELETE' })
            }

            formatRows={(rows) =>
                rows.map((r) => ({
                    ...r,
                    target_amount_cents:
                        r.target_amount_cents == null ? null : r.target_amount_cents / 100,
                }))
            }

            createDefaults={{
                currency: user.currency,
                priority: 3,
                status: 'active',
            }}

            transform={(values) => {
                const v: any = { ...values };

                const rawAmt: unknown = v.target_amount_cents;
                if (rawAmt === '' || rawAmt == null) {
                    v.target_amount_cents = null;
                } else {
                    const n = Number(rawAmt);
                    v.target_amount_cents = Number.isFinite(n) ? Math.round(n * 100) : null;
                }

                const rawHours: unknown = v.target_hours;
                if (rawHours === '' || rawHours == null) {
                    v.target_hours = null;
                } else {
                    const n = Number(rawHours);
                    v.target_hours = Number.isFinite(n) ? n : null;
                }

                if (v.deadline_date) v.deadline_date = String(v.deadline_date).slice(0, 10);
                if (!v.currency) v.currency = user.currency;

                return v;
            }}

            fields={[
                { name: 'name',                 label: 'Name',           type: 'text' },
                { name: 'target_amount_cents',  label: 'Target Amount',  type: 'number' },
                { name: 'target_hours',         label: 'Target Hours',   type: 'number' },
                { name: 'deadline_date',        label: 'Deadline',       type: 'date' },
                {
                    name: 'priority',
                    label: 'Priority',
                    type: 'select',
                    options: [
                        { label: '1', value: 1 },
                        { label: '2', value: 2 },
                        { label: '3', value: 3 },
                        { label: '4', value: 4 },
                        { label: '5', value: 5 },
                    ],
                },
                {
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    options: [
                        { label: 'Active',    value: 'active' },
                        { label: 'Paused',    value: 'paused' },
                        { label: 'Done',      value: 'done' },
                        { label: 'Cancelled', value: 'cancelled' },
                    ],
                },
                {
                    name: 'currency',
                    label: 'Currency',
                    type: 'select',
                    options: CURRENCIES.map((c) => ({ label: c, value: c })),
                },
            ]}

            columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'name', headerName: 'Name', flex: 1 },
                {
                    field: 'target_amount_cents',
                    headerName: 'Target Amount',
                    width: 160,
                    renderCell: (p: any) => {
                        const v = p.value;
                        if (v == null) return '';
                        const cur = p.row?.currency ?? '';
                        return `${Number(v).toFixed(2)} ${cur}`;
                    },
                },
                { field: 'target_hours',  headerName: 'Target Hours', width: 140 },
                { field: 'deadline_date', headerName: 'Deadline', width: 140 },
                { field: 'priority',      headerName: 'Priority', width: 110 },
                { field: 'status',        headerName: 'Status',   width: 130 },
                { field: 'currency',      headerName: 'Currency', width: 120 },

                // ── Insights ─────────────────────────────────────────────────────────
                {
                    field: '__ins.targetH',
                    headerName: 'Target (h)',
                    width: 130,
                    valueGetter: (p: any) => p?.row?.__ins?.targetH ?? null,
                    renderCell: (p: any) => fmtH(p?.row?.__ins?.targetH),
                    sortable: false,
                },
                {
                    field: '__ins.progressH',
                    headerName: 'Progress (h)',
                    width: 140,
                    valueGetter: (p: any) => p?.row?.__ins?.progressH ?? 0,
                    renderCell: (p: any) => fmtH(p?.row?.__ins?.progressH),
                    sortable: false,
                },
                {
                    field: '__ins.remainingH',
                    headerName: 'Remaining (h)',
                    width: 150,
                    valueGetter: (p: any) => p?.row?.__ins?.remainingH ?? null,
                    renderCell: (p: any) => fmtH(p?.row?.__ins?.remainingH),
                    sortable: false,
                },
                {
                    field: '__ins.progressPct',
                    headerName: 'Progress (%)',
                    width: 130,
                    valueGetter: (p: any) => p?.row?.__ins?.progressPct ?? null,
                    renderCell: (p: any) => {
                        const v = p?.row?.__ins?.progressPct as number | null | undefined;
                        return v == null ? '—' : `${v.toFixed(0)}%`;
                    },
                    sortable: false,
                },
                {
                    field: '__ins.etaMonths',
                    headerName: 'ETA (mo)',
                    width: 110,
                    valueGetter: (p: any) => p?.row?.__ins?.etaMonths ?? null,
                    renderCell: (p: any) => {
                        const v = p?.row?.__ins?.etaMonths as number | null | undefined;
                        return v == null ? '—' : v.toFixed(1);
                    },
                    sortable: false,
                },
                {
                    field: '__ins.needsHourlyRate',
                    headerName: 'Needs rate?',
                    width: 130,
                    valueGetter: (p: any) => p?.row?.__ins?.needsHourlyRate ?? false,
                    renderCell: (p: any) => {
                        const w = !!p?.row?.__ins?.needsHourlyRate;
                        return w ? 'Yes' : 'No';
                    },
                    sortable: false,
                },
            ]}

            rowActions={(row) => [
                <GridActionsCellItem
                    key="contrib"
                    icon={<ReceiptLongIcon />}
                    label="Contributions"
                    onClick={() => nav(`/goals/${(row as any).id}/contributions`)}
                    showInMenu
                />,
            ]}
        />
    );
}
