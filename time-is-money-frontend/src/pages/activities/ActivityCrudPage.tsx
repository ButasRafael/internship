// src/pages/ActivityCrudPage.tsx
import { useEffect, useMemo, useState } from 'react';
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import { Stack, Typography, TextField } from '@mui/material';
import { fx } from '@/lib/fx';
import { activitySnapshotForMonth, currentMonthKey, fmtH } from '@/lib/insights';

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const;

type Category = { id:number; name:string; kind:'expense'|'object'|'activity'|'mixed' };

type ActivityRow = {
    id: number;
    name: string;
    category_id: number | null;
    duration_minutes: number;
    frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
    direct_cost_cents: number | null;
    saved_minutes: number;
    currency: string;
    notes: string | null;
};

type ActivityRowUI = ActivityRow & {
    __ins?: {
        k: number;
        timeCostH: number;
        moneyH: number | null;
        perOccCostH: number | null;
        savedHperOcc: number;
        netHperOcc: number | null;
        netHperMonth: number | null;
        roi: number | null;
        worth: boolean | null;
    }
};

export default function ActivityCrudPage() {
    const user = useAuth((s) => s.user)!;
    const [effectiveRate, setEffectiveRate] = useState<number | null | undefined>(undefined);
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());

    const [cats, setCats] = useState<Category[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<Category[]>(`/api/users/${user.id}/categories`);
                setCats(data.filter(c => c.kind === 'activity' || c.kind === 'mixed'));
            } catch {
                setCats([]);
            }
        })();
    }, [user.id]);

    const catOptions = useMemo(
        () => cats.map(c => ({ label: c.name, value: c.id })),
        [cats]
    );
    const catNameById = useMemo(
        () => Object.fromEntries(catOptions.map(o => [o.value, o.label] as const)),
        [catOptions]
    );

    const ctx = useMemo(() => ({
        userCurrency: user.currency,
        hourlyRate: user.hourly_rate ?? null,
        fx: (from:string, to:string, date:Date) => fx(from, to, date),
    }), [user.currency, user.hourly_rate]);

    useEffect(() => {
        (async () => {
            try {
                const rates = await apiFetch<{ month: string; hourly_rate: number | null }[]>(`/api/users/${user.id}/hourly-rates?from=${selectedMonth}&to=${selectedMonth}`);
                setEffectiveRate(rates?.[0]?.hourly_rate ?? (user.hourly_rate ?? null));
            } catch {
                setEffectiveRate(user.hourly_rate ?? null);
            }
        })();
    }, [user.id, user.hourly_rate, selectedMonth]);

    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField
                    type="month"
                    label="Month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    size="small"
                    sx={{ width: 200 }}
                />
                <Typography variant="caption" color="text.secondary">
                    {effectiveRate
                        ? `Effective rate for ${selectedMonth}: ${effectiveRate}/h · ${ctx.userCurrency}`
                        : 'Set hourly rate to value direct costs in hours'}
                </Typography>
            </Stack>
            <GenericCrudPage<ActivityRowUI>
                title="Activities"

                fetchList={async () => {
                    const rows = await apiFetch<ActivityRow[]>(`/api/users/${user.id}/activities`);
                    const rates = await apiFetch<{ month: string; hourly_rate: number | null }[]>(`/api/users/${user.id}/hourly-rates?from=${selectedMonth}&to=${selectedMonth}`);
                    const eff = rates?.[0]?.hourly_rate ?? (user.hourly_rate ?? null);
                    const ctx2 = { ...ctx, hourlyRateFor: () => eff } as typeof ctx & { hourlyRateFor: (mk: string) => number | null };
                    return await Promise.all(rows.map(async (r) => {
                        const base = await activitySnapshotForMonth(r, selectedMonth, ctx2);

                        // Stable local derivations (no engine drift):
                        const savedHperOcc = (Number(r.saved_minutes) || 0) / 60;
                        const perOccCostH  = base.perOccCostH; // time + money or null
                        const netHperOcc   = perOccCostH == null ? null : (savedHperOcc - perOccCostH);
                        const netHperMonth = netHperOcc == null ? null : netHperOcc * base.k;
                        const roi          = (perOccCostH && perOccCostH > 0) ? (savedHperOcc / perOccCostH) : null;
                        const worth        = netHperOcc == null ? null : netHperOcc > 0;

                        return {
                            ...r,
                            direct_cost_cents: r.direct_cost_cents == null ? null : r.direct_cost_cents / 100,
                            __ins: {
                                k: base.k,
                                timeCostH: base.timeCostH,
                                moneyH: base.moneyH,
                                perOccCostH,
                                savedHperOcc,
                                netHperOcc,
                                netHperMonth,
                                roi,
                                worth,
                            },
                        } as ActivityRowUI;
                    }));
                }}

                createItem={(data) =>
                    apiFetch(`/api/users/${user.id}/activities`, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                updateItem={(id, data) =>
                    apiFetch(`/api/users/${user.id}/activities/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                deleteItem={(id) =>
                    apiFetch(`/api/users/${user.id}/activities/${id}`, { method: 'DELETE' })
                }

                transform={(values) => {
                    const v: any = { ...values };

                    if (v.direct_cost_cents == null || v.direct_cost_cents === '') {
                        v.direct_cost_cents = 0;
                    } else {
                        const n = Number(v.direct_cost_cents);
                        v.direct_cost_cents = Number.isFinite(n) ? Math.round(n * 100) : 0;
                    }

                    if (v.category_id === '' || v.category_id == null) v.category_id = null;
                    else v.category_id = Number(v.category_id);

                    if (!v.currency) v.currency = user.currency;

                    return v;
                }}

                createDefaults={{
                    currency: user.currency,
                    frequency: 'once',
                    duration_minutes: 60,
                    saved_minutes: 0,
                }}

                fields={[
                    { name: 'name',               label: 'Name',                 type: 'text' },
                    { name: 'category_id',        label: 'Category',             type: 'select', options: catOptions, required: false },
                    { name: 'duration_minutes',   label: 'Duration (minutes)',   type: 'number' },
                    {
                        name: 'frequency',
                        label: 'Frequency',
                        type: 'select',
                        options: [
                            { label: 'Once',    value: 'once' },
                            { label: 'Weekly',  value: 'weekly' },
                            { label: 'Monthly', value: 'monthly' },
                            { label: 'Yearly',  value: 'yearly' },
                        ],
                    },
                    { name: 'direct_cost_cents',  label: 'Direct Cost',          type: 'number' },
                    { name: 'saved_minutes',      label: 'Saved Minutes',        type: 'number' },
                    { name: 'currency',           label: 'Currency',             type: 'select', options: CURRENCIES.map(c => ({ label: c, value: c })) },
                    { name: 'notes',              label: 'Notes',                type: 'text', required: false },
                ]}

                columns={[
                    { field: 'id', headerName: 'ID', width: 80 },
                    { field: 'name', headerName: 'Name', flex: 1 },
                    {
                        field: 'category_id',
                        headerName: 'Category',
                        width: 180,
                        valueFormatter: (value) => {
                            const id = value as number | null | undefined;
                            if (id == null) return '';
                            return (catNameById as Record<number, string>)[id] ?? String(id);
                        },
                    },
                    { field: 'duration_minutes', headerName: 'Duration (min)', width: 150 },
                    { field: 'frequency',        headerName: 'Frequency',      width: 130 },
                    {
                        field: 'direct_cost_cents',
                        headerName: 'Direct Cost',
                        width: 160,
                        type: 'number',
                        renderCell: (p: any) => {
                            const v = p?.row?.direct_cost_cents;
                            if (v == null || v === '') return '';
                            const cur = p?.row?.currency ?? '';
                            return `${Number(v).toFixed(2)} ${cur}`;
                        },
                    },
                    { field: 'saved_minutes', headerName: 'Saved Minutes', width: 160 },
                    { field: 'currency',      headerName: 'Currency',      width: 120 },

                    {
                        field: '__ins.timeCostH',
                        headerName: 'Time cost (h)',
                        width: 130,
                        valueGetter: (p:any) => p?.row?.__ins?.timeCostH ?? null,
                        renderCell: (p:any) => fmtH(p?.row?.__ins?.timeCostH),
                        sortable: false,
                    },
                    {
                        field: '__ins.moneyH',
                        headerName: 'Money cost (h)',
                        width: 150,
                        valueGetter: (p:any) => p?.row?.__ins?.moneyH ?? null,
                        renderCell: (p:any) => fmtH(p?.row?.__ins?.moneyH),
                        sortable: false,
                    },
                    {
                        field: '__ins.perOccCostH',
                        headerName: 'Total cost/occ (h)',
                        width: 160,
                        valueGetter: (p:any) => p?.row?.__ins?.perOccCostH ?? null,
                        renderCell: (p:any) => fmtH(p?.row?.__ins?.perOccCostH),
                        sortable: false,
                    },
                    {
                        field: '__ins.savedHperOcc',
                        headerName: 'Saved/occ (h)',
                        width: 130,
                        valueGetter: (p:any) => p?.row?.__ins?.savedHperOcc ?? 0,
                        renderCell: (p:any) => fmtH(p?.row?.__ins?.savedHperOcc),
                        sortable: false,
                    },
                    {
                        field: '__ins.netHperOcc',
                        headerName: 'Net/occ (h)',
                        width: 130,
                        valueGetter: (p:any) => p?.row?.__ins?.netHperOcc ?? null,
                        renderCell: (p:any) => {
                            const v = p?.row?.__ins?.netHperOcc as number | null | undefined;
                            return (
                                <span style={{ color: v != null && v >= 0 ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)' }}>
                  {fmtH(v)}
                </span>
                            );
                        },
                        sortable: false,
                    },
                    {
                        field: '__ins.netHperMonth',
                        headerName: 'Net/mo (h)',
                        width: 130,
                        valueGetter: (p:any) => p?.row?.__ins?.netHperMonth ?? null,
                        renderCell: (p:any) => {
                            const v = p?.row?.__ins?.netHperMonth as number | null | undefined;
                            return (
                                <span style={{ color: v != null && v >= 0 ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)' }}>
                  {fmtH(v)}
                </span>
                            );
                        },
                        sortable: false,
                    },
                    {
                        field: '__ins.roi',
                        headerName: 'ROI (saved/cost)',
                        width: 150,
                        valueGetter: (p:any) => p?.row?.__ins?.roi ?? null,
                        renderCell: (p:any) => {
                            const r = p?.row?.__ins?.roi as number | null | undefined;
                            return r == null ? '—' : `${(r * 100).toFixed(0)}%`;
                        },
                        sortable: false,
                    },
                    {
                        field: '__ins.worth',
                        headerName: 'Worth?',
                        width: 110,
                        valueGetter: (p:any) => p?.row?.__ins?.worth ?? null,
                        renderCell: (p:any) => {
                            const w = p?.row?.__ins?.worth as boolean | null | undefined;
                            if (w == null) return '—';
                            return (
                                <span style={{ color: w ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)', fontWeight: 600 }}>
                  {w ? 'Yes' : 'No'}
                </span>
                            );
                        },
                        sortable: false,
                    },
                ]}
            />
        </>
    );
}
