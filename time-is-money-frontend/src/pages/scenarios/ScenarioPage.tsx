import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Divider, Grid, IconButton, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Alert, Card, CardContent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import dayjs from 'dayjs';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import BuildIcon from '@mui/icons-material/Build';
import { useNavigate } from 'react-router-dom';

type ScenarioRow = { id: number; name: string; params_json: any; created_at: string };
type Category = { id:number; name:string; kind:'expense'|'object'|'activity'|'mixed' };

export default function ScenarioPage() {
  const user = useAuth((s) => s.user)!;
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [params, setParams] = useState<any>({ hourlyRates: {}, scaleByCategory: [] });
  const [from, setFrom] = useState(dayjs().subtract(5, 'month').format('YYYY-MM'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM'));
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await apiFetch<ScenarioRow[]>(`/api/users/${user.id}/scenarios`);
        setScenarios(list);
        if (list.length && selectedId == null) selectScenario(list[0]);
      } catch {}
    })();
  }, [user.id]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Category[]>(`/api/users/${user.id}/categories`);
        setCats(data);
      } catch { setCats([]); }
    })();
  }, [user.id]);

  function selectScenario(sc: ScenarioRow) {
    setSelectedId(sc.id);
    setParams(sc.params_json || {});
    setResult(null);
  }

  async function createScenario() {
    const name = `Scenario ${scenarios.length + 1}`;
    const sc = await apiFetch<ScenarioRow>(`/api/users/${user.id}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, params_json: {} }),
    });
    setScenarios([sc, ...scenarios]);
    selectScenario(sc);
  }

  async function deleteScenario(id: number) {
    await apiFetch(`/api/users/${user.id}/scenarios/${id}`, { method: 'DELETE' });
    const next = scenarios.filter((s) => s.id !== id);
    setScenarios(next);
    if (selectedId === id) {
      if (next.length) selectScenario(next[0]); else { setSelectedId(null); setParams({}); setResult(null); }
    }
  }

  async function renameScenario(id: number, name: string) {
    const existing = scenarios.find((s) => s.id === id);
    const body = { name, params_json: existing?.params_json ?? {} } as any;
    const sc = await apiFetch<ScenarioRow>(`/api/users/${user.id}/scenarios/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    setScenarios(scenarios.map((s) => (s.id === id ? sc : s)));
  }

  async function saveParams() {
    if (!selectedId) return;
    const existing = scenarios.find((s) => s.id === selectedId);
    const body = { name: existing?.name ?? `Scenario ${selectedId}` , params_json: params } as any;
    const sc = await apiFetch<ScenarioRow>(`/api/users/${user.id}/scenarios/${selectedId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    setScenarios(scenarios.map((s) => (s.id === sc.id ? sc : s)));
  }

  async function evaluate() {
    setLoading(true); setResult(null);
    try {
      const payload = { from, to, params_json: params };
      const data = await apiFetch(`/api/users/${user.id}/scenarios/preview`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      setResult(data);
    } catch (e) {
      setResult({ error: (e as any)?.message || 'failed' });
    } finally { setLoading(false); }
  }

  // helpers for quick templates
  function addHourlyRate() {
    const m = dayjs().format('YYYY-MM');
    const r = 100;
    setParams((p: any) => ({ ...p, hourlyRates: { ...(p.hourlyRates || {}), [m]: r } }));
  }
  function addScaleEntry() {
    setParams((p: any) => ({ ...p, scaleByCategory: [ ...(p.scaleByCategory || []), { kind: 'expense', category_id: cats[0]?.id || 0, factor: 0.9 } ] }));
  }

  const fmt = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }), []);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!result?.months) return [];
    
    return result.months.map((month: string) => ({
      month,
      baseline: result.baseline?.timeBurnNet?.[month] ?? 0,
      scenario: result.scenario?.timeBurnNet?.[month] ?? 0,
      diff: result.diff?.timeBurnNet?.[month] ?? 0,
    }));
  }, [result]);

  return (
    <Box>
      {/* Header with builder links */}
      <Alert 
        severity="info" 
        sx={{ mb: 2 }}
        action={
          <Stack direction="row" spacing={1}>
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<BuildIcon />}
              onClick={() => navigate('/scenarios/builder')}
            >
              Drag & Drop Builder
            </Button>
            <Button 
              size="small" 
              variant="contained" 
              startIcon={<BuildIcon />}
              onClick={() => navigate('/scenarios/enhanced')}
            >
              Enhanced Builder
            </Button>
          </Stack>
        }
      >
        🚀 <strong>New!</strong> Try our enhanced scenario builders with advanced variables, better comparisons, and intuitive interfaces!
      </Alert>

      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p:2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>Scenarios</Typography>
              <Button size="small" variant="contained" onClick={createScenario}>New</Button>
            </Stack>
          <Stack spacing={1}>
            {scenarios.map((s) => (
              <Paper key={s.id} variant={selectedId === s.id ? 'elevation' : 'outlined'} sx={{ p: 1.2, display:'flex', alignItems:'center', gap:1 }}>
                <TextField size="small" value={s.name} onChange={(e) => renameScenario(s.id, e.target.value)} />
                <Button size="small" onClick={() => selectScenario(s)}>Edit</Button>
                <IconButton size="small" onClick={() => deleteScenario(s.id)}><DeleteIcon fontSize="small"/></IconButton>
              </Paper>
            ))}
          </Stack>
        </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
        <Paper sx={{ p:2, mb:2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Evaluate Window</Typography>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems={'center'} sx={{ mt:1 }}>
            <TextField type="month" label="From" size="small" value={from} onChange={(e)=>setFrom(e.target.value)} sx={{ width: 180 }}/>
            <TextField type="month" label="To" size="small" value={to} onChange={(e)=>setTo(e.target.value)} sx={{ width: 180 }}/>
            <Button variant="contained" onClick={evaluate} disabled={loading}>{loading ? 'Evaluating…' : 'Evaluate'}</Button>
            <Button onClick={saveParams} disabled={!selectedId}>Save params</Button>
          </Stack>
        </Paper>

        <Paper sx={{ p:2, mb:2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Parameters</Typography>
          <Stack spacing={2} sx={{ mt:1 }}>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems={'center'}>
              <Typography>Hourly Rates</Typography>
              <Button size="small" onClick={addHourlyRate}>Add current month</Button>
            </Stack>
            <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1 }}>
              {Object.entries(params.hourlyRates || {}).map(([m, r]: any) => (
                <Stack key={m} direction={'row'} spacing={1}>
                  <TextField type="month" size="small" value={m} onChange={(e)=>{
                    const v = e.target.value; setParams((p:any)=>{ const hr={...(p.hourlyRates||{})}; const val=hr[m]; delete hr[m]; hr[v]=val; return { ...p, hourlyRates: hr };})
                  }}/>
                  <TextField type="number" size="small" label="Rate" value={r} onChange={(e)=>{
                    const v = e.target.value===''?null:Number(e.target.value); setParams((p:any)=>({ ...p, hourlyRates: { ...(p.hourlyRates||{}), [m]: v } }))
                  }}/>
                </Stack>
              ))}
            </Box>

            <Divider />
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems={'center'}>
              <Typography>Scale By Category</Typography>
              <Button size="small" onClick={addScaleEntry}>Add entry</Button>
            </Stack>
            <Stack spacing={1}>
              {(params.scaleByCategory || []).map((s:any, idx:number) => (
                <Stack key={idx} direction={{ xs:'column', sm:'row' }} spacing={1}>
                  <Select size="small" value={s.kind} onChange={(e)=>updateScale(idx, { kind: e.target.value })} sx={{ width: 140 }}>
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="activity">Activity</MenuItem>
                    <MenuItem value="object">Object</MenuItem>
                  </Select>
                  <Select size="small" value={s.category_id} onChange={(e) => updateScale(idx, { category_id: Number(e.target.value) })} sx={{ minWidth: 200 }}>
                    {cats.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                  </Select>
                  <TextField size="small" type="number" label="Factor" value={s.factor} onChange={(e)=>updateScale(idx, { factor: Number(e.target.value) })} sx={{ width: 140 }}/>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Paper>

        {result && result.months && (
          <Stack spacing={2}>
            {/* Summary Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Scenario Impact</Typography>
                <Typography variant="h4" color="primary" fontWeight={600}>
                  {fmt.format(result.diff?.netSavingsHoursPerMonthDelta ?? 0)} h/month
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average net time savings
                </Typography>
              </CardContent>
            </Card>

            {/* Line Chart */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Time Burn Comparison (hours/month)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Baseline"
                  />
                  <Line
                    type="monotone"
                    dataKey="scenario"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Scenario"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>

            {/* Difference Bar Chart */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Time Savings per Month (hours)
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="diff"
                    fill="#ffc658"
                    name="Time Saved"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            {/* Data Table */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Detailed Data
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Baseline (h)</TableCell>
                    <TableCell align="right">Scenario (h)</TableCell>
                    <TableCell align="right">Difference (h)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.months.map((m: string) => (
                    <TableRow key={m}>
                      <TableCell>{m}</TableCell>
                      <TableCell align="right">{fmt.format(result.baseline?.timeBurnNet?.[m] ?? 0)}</TableCell>
                      <TableCell align="right">{fmt.format(result.scenario?.timeBurnNet?.[m] ?? 0)}</TableCell>
                      <TableCell align="right" sx={{ 
                        color: (result.diff?.timeBurnNet?.[m] ?? 0) > 0 ? 'success.main' : 'error.main',
                        fontWeight: 600
                      }}>
                        {fmt.format(result.diff?.timeBurnNet?.[m] ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Stack>
        )}
        </Grid>
      </Grid>
    </Box>
  );

  function updateScale(idx: number, patch: any) {
    setParams((p: any) => {
      const arr = [...(p.scaleByCategory || [])];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...p, scaleByCategory: arr };
    });
  }
}
