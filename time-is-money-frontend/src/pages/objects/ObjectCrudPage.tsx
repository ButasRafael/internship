import { useEffect, useMemo, useState } from 'react';
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import dayjs from 'dayjs';

import { Stack, Typography } from '@mui/material';
import { fx } from '@/lib/fx';
import { currentMonthKey, fmtH, objectSnapshotForMonth } from '@/lib/insights';

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const;

type Category = { id:number; name:string; kind:'expense'|'object'|'activity'|'mixed' };

type ObjectRow = {
    id: number;
    name: string;
    category_id: number | null;
    price_cents: number;
    currency: string;
    purchase_date: string;
    expected_life_months: number;
    maintenance_cents_per_month: number;
    hours_saved_per_month: number;
    notes: string | null;
    image_path?: string | null;
    image_url?: string | null;
};

type ObjectRowUI = ObjectRow & {
    __ins?: {
        maintH: number | null;
        capexHport: number | null;
        savedH: number;
        netH: number | null;
    };
};

export default function ObjectCrudPage() {
    const user = useAuth((s) => s.user)!;

    const [cats, setCats] = useState<Category[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<Category[]>(`/api/users/${user.id}/categories`);
                setCats(data.filter((c) => c.kind === 'object' || c.kind === 'mixed'));
            } catch {
                setCats([]);
            }
        })();
    }, [user.id]);

    const catOptions = useMemo(() => cats.map((c) => ({ label: c.name, value: c.id })), [cats]);
    const catNameById = useMemo(
        () => Object.fromEntries(catOptions.map((o) => [o.value, o.label] as const)),
        [catOptions]
    );

    const ctx = useMemo(
        () => ({
            userCurrency: user.currency,
            hourlyRate: user.hourly_rate ?? null,
            fx: (from: string, to: string, date: Date) => fx(from, to, date),
            amortizeCapexMonths: 6, // same default as dashboard
        }),
        [user.currency, user.hourly_rate]
    );

    const monthNow = currentMonthKey();

    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    {ctx.hourlyRate
                        ? `Rate: ${ctx.hourlyRate}/h · ${ctx.userCurrency}`
                        : 'Set hourly rate to see hours computed from money'}
                </Typography>
            </Stack>

            <GenericCrudPage<ObjectRowUI>
                key={`${user.hourly_rate ?? 'NA'}-${user.currency}-${monthNow}`}
                title="Objects"
                fetchList={async () => {
                    const rows = await apiFetch<ObjectRow[]>(`/api/users/${user.id}/objects`);
                    return await Promise.all(
                        rows.map(async (r) => {
                            const ins = await objectSnapshotForMonth(r, monthNow, ctx);
                            return {
                                ...r,
                                price_cents: r.price_cents / 100,
                                maintenance_cents_per_month: r.maintenance_cents_per_month / 100,
                                __ins: ins,
                            } as ObjectRowUI;
                        })
                    );
                }}
                createItem={(data) =>
                    apiFetch(`/api/users/${user.id}/objects`, {
                        method: 'POST',
                        body: data instanceof FormData ? data : JSON.stringify(data),
                        headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
                    })
                }
                updateItem={(id, data) =>
                    apiFetch(`/api/users/${user.id}/objects/${id}`, {
                        method: 'PUT',
                        body: data instanceof FormData ? data : JSON.stringify(data),
                        headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
                    })
                }
                deleteItem={(id) => apiFetch(`/api/users/${user.id}/objects/${id}`, { method: 'DELETE' })}
                createDefaults={{
                    currency: user.currency,
                    purchase_date: dayjs().format('YYYY-MM-DD'),
                    category_id: null,
                    expected_life_months: 12,
                    hours_saved_per_month: 0,
                    maintenance_cents_per_month: 0,
                } as Partial<ObjectRow>}
                transform={(values) => {
                    const v: any = { ...values };

                    if (v.category_id === '' || v.category_id == null) v.category_id = null;
                    else v.category_id = Number(v.category_id);

                    const toCents = (x: unknown) => {
                        if (x === '' || x == null) return 0;
                        const n = Number(x);
                        return Number.isFinite(n) ? Math.round(n * 100) : 0;
                    };
                    if ('price_cents' in v) v.price_cents = toCents(v.price_cents);
                    if ('maintenance_cents_per_month' in v)
                        v.maintenance_cents_per_month = toCents(v.maintenance_cents_per_month);

                    if (v.hours_saved_per_month === '' || v.hours_saved_per_month == null) {
                        v.hours_saved_per_month = 0;
                    } else {
                        const h = Number(v.hours_saved_per_month);
                        v.hours_saved_per_month = Number.isFinite(h) ? h : 0;
                    }

                    if (v.expected_life_months != null && v.expected_life_months !== '') {
                        v.expected_life_months = Number(v.expected_life_months);
                    }

                    if (v.purchase_date) v.purchase_date = String(v.purchase_date).slice(0, 10);
                    if (!v.currency) v.currency = user.currency;
                    if (v.notes === '') v.notes = null;

                    return v;
                }}
                fields={[
                    { name: 'name', label: 'Name', type: 'text' },
                    { name: 'category_id', label: 'Category', type: 'select', options: catOptions, required: false },
                    { name: 'price_cents', label: 'Price', type: 'number' },
                    {
                        name: 'currency',
                        label: 'Currency',
                        type: 'select',
                        options: CURRENCIES.map((c) => ({ label: c, value: c })),
                    },
                    { name: 'purchase_date', label: 'Purchase Date', type: 'date' },
                    { name: 'expected_life_months', label: 'Life (months)', type: 'number' },
                    { name: 'maintenance_cents_per_month', label: 'Maintenance (per month)', type: 'number' },
                    { name: 'hours_saved_per_month', label: 'Hours Saved / month', type: 'number' },
                    { name: 'notes', label: 'Notes', type: 'text', required: false },
                    { name: 'image' as any, label: 'Image', type: 'file', accept: 'image/jpeg,image/png,image/webp', required: false },
                ]}
                columns={[
                    { field: 'id', headerName: 'ID', width: 80 },
                    { field: 'name', headerName: 'Name', flex: 1 },
                    {
                        field: 'category_id',
                        headerName: 'Category',
                        width: 200,
                        renderCell: (params: any) => {
                            const id = params?.row?.category_id as number | null | undefined;
                            if (id == null) return '';
                            return (catNameById as Record<number, string>)[id] ?? String(id);
                        },
                    },
                    {
                        field: 'price_cents',
                        headerName: 'Price',
                        width: 160,
                        type: 'number',
                        renderCell: (p: any) => {
                            const v = p?.row?.price_cents;
                            if (v == null) return '';
                            const cur = p?.row?.currency ?? '';
                            return `${Number(v).toFixed(2)} ${cur}`;
                        },
                    },
                    { field: 'currency', headerName: 'Currency', width: 110 },
                    { field: 'purchase_date', headerName: 'Purchase Date', width: 130 },
                    { field: 'expected_life_months', headerName: 'Life (months)', width: 140 },
                    {
                        field: 'maintenance_cents_per_month',
                        headerName: 'Maintenance / month',
                        width: 180,
                        type: 'number',
                        renderCell: (p: any) => {
                            const v = p?.row?.maintenance_cents_per_month;
                            if (v == null) return '';
                            const cur = p?.row?.currency ?? '';
                            return `${Number(v).toFixed(2)} ${cur}`;
                        },
                    },
                    { field: 'hours_saved_per_month', headerName: 'Hours Saved / month', width: 170 },

                    {
                        field: '__ins.maintH',
                        headerName: 'Maint (h/mo)',
                        width: 130,
                        valueGetter: (p: any) => p?.row?.__ins?.maintH ?? null,
                        renderCell: (p: any) => fmtH(p?.row?.__ins?.maintH),
                        sortable: false,
                    },
                    {
                        field: '__ins.capexHport',
                        headerName: 'Capex amort (h)',
                        width: 150,
                        valueGetter: (p: any) => p?.row?.__ins?.capexHport ?? null,
                        renderCell: (p: any) => fmtH(p?.row?.__ins?.capexHport),
                        sortable: false,
                    },
                    {
                        field: '__ins.savedH',
                        headerName: 'Saved (h/mo)',
                        width: 130,
                        valueGetter: (p: any) => p?.row?.__ins?.savedH ?? 0,
                        renderCell: (p: any) => fmtH(p?.row?.__ins?.savedH),
                        sortable: false,
                    },
                    {
                        field: '__ins.netH',
                        headerName: 'Net (h, month)',
                        width: 150,
                        valueGetter: (p: any) => p?.row?.__ins?.netH ?? null,
                        renderCell: (p: any) => {
                            const v = p?.row?.__ins?.netH as number | null | undefined;
                            return (
                                <span
                                    style={{
                                        color:
                                            v != null && v <= 0
                                                ? 'var(--mui-palette-success-main)'
                                                : 'var(--mui-palette-error-main)',
                                    }}
                                >
                  {fmtH(v)}
                </span>
                            );
                        },
                        sortable: false,
                    },

                    {
                        field: 'image',
                        headerName: 'Image',
                        width: 84,
                        sortable: false,
                        filterable: false,
                        renderCell: (p: any) => {
                            const raw = p.row?.image_url || (p.row?.image_path ? `/uploads/${p.row.image_path}` : null);
                            if (!raw) return '';
                            const base = import.meta.env.VITE_API_URL ?? '';
                            const url = raw.startsWith('http') ? raw : `${base}${raw}`;
                            return (
                                <img
                                    src={url}
                                    alt={p.row?.name ?? ''}
                                    style={{ width: 'auto', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }}
                                    loading="lazy"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(url, '_blank');
                                    }}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            );
                        },
                    },
                ]}
            />
        </>
    );
}
