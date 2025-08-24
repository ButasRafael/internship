import { useEffect, useMemo, useState } from 'react';
import { Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import dayjs from 'dayjs';
import { useNotifications } from '@/components/NotificationsContext';

type RateRow = { month: string; hourly_rate: number | null };

function monthKey(d: Date) { return dayjs(d).format('YYYY-MM'); }
function addMonths(ym: string, n: number) { return dayjs(ym + '-01').add(n, 'month').format('YYYY-MM'); }

export default function HourlyRatesPage() {
  const user = useAuth((s) => s.user)!;
  const notify = useNotifications();

  const now = monthKey(new Date());
  const from = addMonths(now, -12);
  const to = addMonths(now, +3);

  const monthList = useMemo(() => {
    const out: string[] = [];
    let cur = from;
    while (cur <= to) { out.push(cur); cur = addMonths(cur, 1); }
    return out;
  }, [from, to]);

  const [rows, setRows] = useState<RateRow[]>([]);
  const [original, setOriginal] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<RateRow[]>(`/api/users/${user.id}/hourly-rates?from=${from}&to=${to}`);
        if (cancelled) return;
        const map: Record<string, number | null> = {};
        for (const r of data) map[r.month] = r.hourly_rate != null ? Number(r.hourly_rate) : null;
        setOriginal(map);
        setRows(monthList.map((m) => ({ month: m, hourly_rate: map[m] ?? null })));
      } catch (e: any) {
        notify.show(`Failed to load rates: ${e?.message ?? 'unknown error'}`, { severity: 'error' });
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true };
  }, [user.id, from, to, monthList, notify]);

  const dirty = useMemo(() => {
    return rows.some((r) => (r.hourly_rate ?? null) !== (original[r.month] ?? null));
  }, [rows, original]);

  const onChange = (idx: number, v: string) => {
    setRows((prev) => {
      const copy = [...prev];
      const n = v === '' ? null : Number(v);
      copy[idx] = { ...copy[idx], hourly_rate: (v === '' || Number.isNaN(n)) ? null : n };
      return copy;
    });
  };

  async function save() {
    setSaving(true);
    try {
      const changed = rows.filter((r) => (r.hourly_rate ?? null) !== (original[r.month] ?? null));
      await Promise.all(changed.map((r) =>
        apiFetch(`/api/users/${user.id}/hourly-rates`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: r.month, hourly_rate: r.hourly_rate ?? 0 }),
        })
      ));
      const map: Record<string, number | null> = { ...original };
      for (const r of changed) map[r.month] = r.hourly_rate ?? null;
      setOriginal(map);
      notify.show('Rates saved.', { severity: 'success' });
    } catch (e: any) {
      notify.show(`Save failed: ${e?.message ?? 'unknown error'}`, { severity: 'error' });
    } finally { setSaving(false); }
  }

  function reset() {
    setRows(monthList.map((m) => ({ month: m, hourly_rate: original[m] ?? null })));
  }

  const fmt = useMemo(() => new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long' }), []);

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>Monthly Hourly Rates</Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>Manage effective rates by month</Typography>
          <Typography variant="body2" color="text.secondary">
            Months without an explicit value inherit the most recent previous month. Editing here only affects the selected month onward.
          </Typography>
          <Divider />
          <Stack spacing={1}>
            {rows.map((r, i) => (
              <Stack key={r.month} direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Typography sx={{ width: { sm: 220 } }}>{fmt.format(dayjs(r.month + '-01').toDate())}</Typography>
                <TextField
                  label={`Hourly rate (${user.currency})`}
                  type="number"
                  value={r.hourly_rate == null ? '' : String(r.hourly_rate)}
                  onChange={(e) => onChange(i, e.target.value)}
                  inputProps={{ step: '0.01', min: '0' }}
                  sx={{ maxWidth: 260 }}
                />
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={save} disabled={!dirty || saving || loading}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button onClick={reset} disabled={!dirty || saving || loading}>Reset</Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}

