import { useEffect, useMemo, useState } from 'react';
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';

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

export default function ActivityCrudPage() {
    const user = useAuth((s) => s.user)!;

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

    return (
        <GenericCrudPage<ActivityRow>
            title="Activities"
            fetchList={() =>
                apiFetch(`/api/users/${user.id}/activities`) as Promise<ActivityRow[]>
            }
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

            formatRows={(rows) =>
                rows.map((r) => ({
                    ...r,
                    direct_cost_cents: r.direct_cost_cents == null ? null : r.direct_cost_cents / 100,
                }))
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
            ]}
        />
    );
}
