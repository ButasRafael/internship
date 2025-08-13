import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import dayjs from 'dayjs';

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const;

export default function IncomeCrudPage() {
    const user = useAuth((s) => s.user)!;

    return (
        <GenericCrudPage
            title="Incomes"
            fetchList={() =>
                apiFetch(`/api/users/${user.id}/incomes`) as Promise<{
                    id: number;
                    received_at: string;
                    amount_cents: number;
                    currency: string;
                    source: 'salary' | 'freelance' | 'bonus' | 'dividend' | 'interest' | 'gift' | 'other';
                    recurring: 'none' | 'weekly' | 'monthly' | 'yearly';
                    notes: string | null;
                }[]>
            }

            createItem={(data) =>
                apiFetch(`/api/users/${user.id}/incomes`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            updateItem={(id, data) =>
                apiFetch(`/api/users/${user.id}/incomes/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            deleteItem={(id) =>
                apiFetch(`/api/users/${user.id}/incomes/${id}`, { method: 'DELETE' })
            }

            createDefaults={{
                currency: user.currency,
                received_at: dayjs().format('YYYY-MM-DD'),
                recurring: 'none',
            }}

            formatRows={(rows) =>
                rows.map(r => ({
                    ...r,
                    amount_cents: r.amount_cents / 100,
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

                if (v.received_at) {
                    v.received_at = String(v.received_at).slice(0, 10);
                }

                if (!v.currency) v.currency = user.currency;
                if (!v.recurring) v.recurring = 'none';
                if (v.notes === '') v.notes = null;

                return v;
            }}

            fields={[
                { name: 'received_at',   label: 'Received At', type: 'date' },
                { name: 'amount_cents',  label: 'Amount',      type: 'number' },
                {
                    name: 'currency',
                    label: 'Currency',
                    type: 'select',
                    options: CURRENCIES.map(c => ({ label: c, value: c })),
                },
                {
                    name: 'source',
                    label: 'Source',
                    type: 'select',
                    options: [
                        { label: 'Salary',    value: 'salary' },
                        { label: 'Freelance', value: 'freelance' },
                        { label: 'Bonus',     value: 'bonus' },
                        { label: 'Dividend',  value: 'dividend' },
                        { label: 'Interest',  value: 'interest' },
                        { label: 'Gift',      value: 'gift' },
                        { label: 'Other',     value: 'other' },
                    ],
                },
                {
                    name: 'recurring',
                    label: 'Recurring',
                    type: 'select',
                    options: [
                        { label: 'None',    value: 'none' },
                        { label: 'Weekly',  value: 'weekly' },
                        { label: 'Monthly', value: 'monthly' },
                        { label: 'Yearly',  value: 'yearly' },
                    ],
                },
                { name: 'notes', label: 'Notes', type: 'text', required: false },
            ]}

            columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'received_at', headerName: 'Received At', flex: 1 },
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
                { field: 'currency',  headerName: 'Currency', width: 120 },
                { field: 'source',    headerName: 'Source',   width: 140 },
                { field: 'recurring', headerName: 'Recurring', width: 130 },
                { field: 'notes',     headerName: 'Notes', flex: 1 },
            ]}
        />
    );
}
