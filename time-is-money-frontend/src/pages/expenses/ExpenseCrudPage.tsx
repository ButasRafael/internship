import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';

const CURRENCIES = ['RON', 'EUR', 'USD', 'GBP', 'CHF'] as const;

export default function ExpenseCrudPage() {
    const user = useAuth((s) => s.user)!;

    return (
        <GenericCrudPage
            title="Expenses"
            fetchList={() =>
                apiFetch(`/api/users/${user.id}/expenses`) as Promise<Array<{
                    id: number;
                    name: string;
                    amount_cents: number;
                    currency: string;
                    frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
                    start_date: string;
                    end_date: string | null;
                }>>
            }

            createItem={(data) =>
                apiFetch(`/api/users/${user.id}/expenses`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            updateItem={(id, data) =>
                apiFetch(`/api/users/${user.id}/expenses/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            deleteItem={(id) =>
                apiFetch(`/api/users/${user.id}/expenses/${id}`, { method: 'DELETE' })
            }

            createDefaults={{ currency: user.currency }}

            formatRows={(rows) =>
                rows.map((r) => ({
                    ...r,
                    amount_cents: r.amount_cents == null ? 0 : r.amount_cents / 100,
                }))
            }

            transform={(values) => {
                const v: any = { ...values };
                if (v.amount_cents === '' || v.amount_cents == null) {
                    v.amount_cents = undefined;
                } else {
                    const n = Number(v.amount_cents);
                    v.amount_cents = Number.isFinite(n) ? Math.round(n * 100) : undefined;
                }

                if (v.start_date) v.start_date = String(v.start_date).slice(0, 10);
                if (v.end_date === '' || v.end_date == null) v.end_date = null;
                else v.end_date = String(v.end_date).slice(0, 10);

                if (!v.currency) v.currency = user.currency;

                return v;
            }}

            fields={[
                { name: 'name',         label: 'Name',    type: 'text' },
                { name: 'amount_cents', label: 'Amount',  type: 'number' },
                {
                    name: 'currency',
                    label: 'Currency',
                    type: 'select',
                    options: CURRENCIES.map(c => ({ label: c, value: c })),
                },
                {
                    name: 'frequency',
                    label: 'Frequency',
                    type: 'select',
                    options: [
                        { label: 'once',    value: 'once' },
                        { label: 'weekly',  value: 'weekly' },
                        { label: 'monthly', value: 'monthly' },
                        { label: 'yearly',  value: 'yearly' },
                    ],
                },
                { name: 'start_date', label: 'Start Date', type: 'date' },
                { name: 'end_date',   label: 'End Date',   type: 'date', required: false },
            ]}

            columns={[
                { field: 'id',   headerName: 'ID', width: 90 },
                { field: 'name', headerName: 'Name', flex: 1 },
                {
                    field: 'amount_cents',
                    headerName: 'Amount',
                    flex: 1,
                    type: 'number',
                    renderCell: (p: any) => {
                        const v = p?.value;
                        if (v == null || v === '') return '';
                        const cur = p?.row?.currency ?? '';
                        return `${Number(v).toFixed(2)} ${cur}`;
                    },
                },
                { field: 'currency',  headerName: 'Currency',  width: 120 },
                { field: 'frequency', headerName: 'Frequency', width: 140 },
                { field: 'start_date', headerName: 'Start',    width: 140 },
                { field: 'end_date',   headerName: 'End',      width: 140 },
            ]}
        />
    );
}
