import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';

export default function CategoryCrudPage() {
    const user = useAuth((s) => s.user)!;

    return (
        <GenericCrudPage
            title="Categories"
            fetchList={() =>
                apiFetch(`/api/users/${user.id}/categories`) as Promise<{
                    id: number;
                    name: string;
                    kind: 'expense' | 'object' | 'activity' | 'mixed';
                }[]>
            }
            createItem={(data) =>
                apiFetch(`/api/users/${user.id}/categories`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            updateItem={(id, data) =>
                apiFetch(`/api/users/${user.id}/categories/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            deleteItem={(id) =>
                apiFetch(`/api/users/${user.id}/categories/${id}`, { method: 'DELETE' })
            }

            createDefaults={{ kind: 'expense' }}

            transform={(values) => ({
                ...values,
                name: typeof values.name === 'string' ? values.name.trim() : values.name,
            })}

            fields={[
                { name: 'name', label: 'Name', type: 'text' },
                {
                    name: 'kind',
                    label: 'Kind',
                    type: 'select',
                    options: [
                        { label: 'Expense',  value: 'expense' },
                        { label: 'Object',   value: 'object' },
                        { label: 'Activity', value: 'activity' },
                        { label: 'Mixed',    value: 'mixed' },
                    ],
                },
            ]}

            columns={[
                { field: 'id', headerName: 'ID', width: 90 },
                { field: 'name', headerName: 'Name', flex: 1 },
                { field: 'kind', headerName: 'Kind', width: 140 },
            ]}
        />
    );
}
