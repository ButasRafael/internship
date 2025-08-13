import * as React from 'react'
import { Stack, FormControl, InputLabel, Select, MenuItem, TextField, Button } from '@mui/material'
import dayjs from 'dayjs'
import GenericCrudPage from '@/components/GenericCrudPage'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/store/auth.store'

const BASES = ['EUR','USD','GBP','CHF'] as const
const QUOTES = ['RON'] as const

export type RateRow = {
    day: string
    base: string
    quote: string
    rate: number
    __key: string
}

export default function ExchangeRatesAdminPage() {
    const can = useAuth(s => s.hasPerm)
    const canManage = can('exchange_rate_manage')

    const [base, setBase] = React.useState<string>('EUR')
    const [quote, setQuote] = React.useState<string>('RON')
    const [day, setDay] = React.useState<string>('') // empty → list all

    const qs = React.useMemo(() => {
        const p = new URLSearchParams()
        if (base)  p.set('base', base)
        if (quote) p.set('quote', quote)
        if (day)   p.set('day', day)
        const s = p.toString()
        return s ? `?${s}` : ''
    }, [base, quote, day])

    const splitKey = (k: string) => {
        const [d, b, q] = k.split('__')
        return { d, b, q }
    }

    return (
        <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel id="base-label">Base</InputLabel>
                    <Select labelId="base-label" label="Base" value={base} onChange={(e)=>setBase(String(e.target.value))}>
                        {BASES.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel id="quote-label">Quote</InputLabel>
                    <Select labelId="quote-label" label="Quote" value={quote} onChange={(e)=>setQuote(String(e.target.value))}>
                        {QUOTES.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                    </Select>
                </FormControl>

                <TextField
                    label="Day"
                    type="date"
                    value={day}
                    onChange={(e)=>setDay(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />

                <Button variant="outlined" onClick={()=>{ setDay(''); }}>Clear day</Button>
            </Stack>

            <GenericCrudPage<RateRow>
                title="Exchange Rates"
                actions={{
                    create: canManage,
                    edit: canManage,
                    delete: canManage,
                }}

                fetchList={() => apiFetch(`/api/exchange-rates${qs}`) as Promise<any[]>}

                createItem={(data) => apiFetch('/api/exchange-rates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })}
                updateItem={(_id, data) => apiFetch('/api/exchange-rates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })}

                deleteItem={(key) => {
                    const { d, b, q } = splitKey(String(key))
                    return apiFetch(`/api/exchange-rates/${encodeURIComponent(d)}/${b}/${q}`, { method: 'DELETE' })
                }}

                formatRows={(rows) => rows.map((r: any) => ({
                    ...r,
                    __key: `${r.day}__${r.base}__${r.quote}`,
                }))}

                idField="__key"

                createDefaults={{
                    day: day || dayjs().format('YYYY-MM-DD'),
                    base,
                    quote,
                    rate: 0,
                }}

                transform={(values) => {
                    const v: any = { ...values }
                    if (v.day)   v.day = String(v.day).slice(0,10)
                    if (v.base)  v.base = String(v.base).toUpperCase()
                    if (v.quote) v.quote = String(v.quote).toUpperCase()
                    if (v.rate === '' || v.rate == null) v.rate = 0
                    else v.rate = Number(v.rate)
                    return v
                }}

                fields={[
                    { name: 'day',   label: 'Day',   type: 'date' },
                    { name: 'base',  label: 'Base',  type: 'select', options: BASES.map(b => ({ label: b, value: b })) },
                    { name: 'quote', label: 'Quote', type: 'select', options: QUOTES.map(q => ({ label: q, value: q })) },
                    { name: 'rate',  label: 'Rate',  type: 'number' },
                ]}

                columns={[
                    { field: 'day',   headerName: 'Day',   width: 140 },
                    { field: 'base',  headerName: 'Base',  width: 100 },
                    { field: 'quote', headerName: 'Quote', width: 100 },
                    { field: 'rate',  headerName: 'Rate',  width: 140, type: 'number' },
                ]}
            />
        </Stack>
    )
}