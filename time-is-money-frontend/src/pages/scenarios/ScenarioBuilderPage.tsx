import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useAuth } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import dayjs from 'dayjs';

type ScenarioRow = { id: number; name: string; params_json: any; created_at: string };
type Category = { id: number; name: string; kind: 'expense' | 'object' | 'activity' | 'mixed' };

interface ScenarioParam {
  id: string;
  type: 'hourlyRate' | 'scaleCategory' | 'addExpense' | 'addIncome';
  name: string;
  data: any;
}

interface SortableParamProps {
  param: ScenarioParam;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  categories: Category[];
}

function SortableParam({ param, onUpdate, onDelete, categories }: SortableParamProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: param.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderParamContent = () => {
    switch (param.type) {
      case 'hourlyRate':
        return (
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              type="month"
              label="Month"
              size="small"
              value={param.data.month || dayjs().format('YYYY-MM')}
              onChange={(e) => onUpdate(param.id, { ...param.data, month: e.target.value })}
            />
            <TextField
              type="number"
              label="Rate ($/hour)"
              size="small"
              value={param.data.rate || 100}
              onChange={(e) => onUpdate(param.id, { ...param.data, rate: Number(e.target.value) })}
            />
          </Stack>
        );
      case 'scaleCategory':
        return (
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Category"
              size="small"
              value={param.data.category_id || categories[0]?.id || 0}
              onChange={(e) => onUpdate(param.id, { ...param.data, category_id: Number(e.target.value) })}
              sx={{ minWidth: 180 }}
              SelectProps={{ native: true }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </TextField>
            <TextField
              select
              label="Type"
              size="small"
              value={param.data.kind || 'expense'}
              onChange={(e) => onUpdate(param.id, { ...param.data, kind: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="expense">Expense</option>
              <option value="activity">Activity</option>
              <option value="object">Object</option>
            </TextField>
            <TextField
              type="number"
              label="Scale Factor"
              size="small"
              value={param.data.factor || 1.0}
              inputProps={{ step: 0.1 }}
              onChange={(e) => onUpdate(param.id, { ...param.data, factor: Number(e.target.value) })}
            />
          </Stack>
        );
      default:
        return <Typography variant="body2">Unknown parameter type</Typography>;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        '&:hover': { boxShadow: 2 },
        transition: 'box-shadow 0.2s',
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <DragIndicatorIcon {...attributes} {...listeners} sx={{ color: 'text.secondary' }} />
          <Chip
            label={param.name}
            size="small"
            color={param.type === 'hourlyRate' ? 'primary' : param.type === 'scaleCategory' ? 'secondary' : 'default'}
          />
          <Box sx={{ flex: 1 }}>
            {renderParamContent()}
          </Box>
          <IconButton size="small" onClick={() => onDelete(param.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ScenarioBuilderPage() {
  const theme = useTheme();
  const user = useAuth((s) => s.user)!;
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [from, setFrom] = useState(dayjs().subtract(5, 'month').format('YYYY-MM'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM'));
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Scenario parameters with drag-and-drop support
  const [scenarioParams, setScenarioParams] = useState<ScenarioParam[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Load scenarios and categories
  useEffect(() => {
    (async () => {
      try {
        const [scenarioList, categoryList] = await Promise.all([
          apiFetch<ScenarioRow[]>(`/api/users/${user.id}/scenarios`),
          apiFetch<Category[]>(`/api/users/${user.id}/categories`),
        ]);
        setScenarios(scenarioList);
        setCategories(categoryList);
        if (scenarioList.length && selectedId == null) selectScenario(scenarioList[0]);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    })();
  }, [user.id, selectedId]);

  function selectScenario(sc: ScenarioRow) {
    setSelectedId(sc.id);
    setResult(null);
    
    // Convert existing params to draggable format
    const params: ScenarioParam[] = [];
    const paramsJson = sc.params_json || {};
    
    // Convert hourly rates
    Object.entries(paramsJson.hourlyRates || {}).forEach(([month, rate], idx) => {
      params.push({
        id: `hr-${idx}`,
        type: 'hourlyRate',
        name: 'Hourly Rate',
        data: { month, rate },
      });
    });
    
    // Convert scale by category
    (paramsJson.scaleByCategory || []).forEach((scale: any, idx: number) => {
      params.push({
        id: `scale-${idx}`,
        type: 'scaleCategory',
        name: 'Scale Category',
        data: scale,
      });
    });
    
    setScenarioParams(params);
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

  async function evaluate() {
    if (!selectedId) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      // Convert scenario params back to the expected format
      const paramsJson: any = { hourlyRates: {}, scaleByCategory: [] };
      
      scenarioParams.forEach(param => {
        if (param.type === 'hourlyRate') {
          paramsJson.hourlyRates[param.data.month] = param.data.rate;
        } else if (param.type === 'scaleCategory') {
          paramsJson.scaleByCategory.push(param.data);
        }
      });
      
      const payload = { from, to, params_json: paramsJson };
      const data = await apiFetch(`/api/users/${user.id}/scenarios/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setResult(data);
    } catch (error) {
      setResult({ error: (error as any)?.message || 'Evaluation failed' });
    } finally {
      setLoading(false);
    }
  }

  function addParameter(type: ScenarioParam['type']) {
    const id = `${type}-${Date.now()}`;
    const newParam: ScenarioParam = {
      id,
      type,
      name: type === 'hourlyRate' ? 'Hourly Rate' : 'Scale Category',
      data: type === 'hourlyRate' 
        ? { month: dayjs().format('YYYY-MM'), rate: 100 }
        : { kind: 'expense', category_id: categories[0]?.id || 0, factor: 1.0 },
    };
    setScenarioParams([...scenarioParams, newParam]);
  }

  function updateParameter(id: string, data: any) {
    setScenarioParams(params => params.map(p => p.id === id ? { ...p, data } : p));
  }

  function deleteParameter(id: string) {
    setScenarioParams(params => params.filter(p => p.id !== id));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setScenarioParams(params => {
        const oldIndex = params.findIndex(p => p.id === active.id);
        const newIndex = params.findIndex(p => p.id === over.id);
        return arrayMove(params, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  }

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

  const activeParam = scenarioParams.find(p => p.id === activeId);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={600}>
            <TimelineIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Scenario Builder
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              type="month"
              label="From"
              size="small"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <TextField
              type="month"
              label="To"
              size="small"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={evaluate}
              disabled={loading || !selectedId}
              startIcon={<CompareArrowsIcon />}
            >
              {loading ? 'Evaluating...' : 'Compare'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2} columns={12} sx={{ flex: 1 }}>
        {/* Left Panel - Scenarios List */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Scenarios</Typography>
              <Button size="small" variant="contained" onClick={createScenario} startIcon={<AddIcon />}>
                New
              </Button>
            </Stack>
            <Stack spacing={1}>
              <AnimatePresence>
                {scenarios.map((scenario) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      variant={selectedId === scenario.id ? 'elevation' : 'outlined'}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 2 },
                        transition: 'all 0.2s',
                        ...(selectedId === scenario.id && {
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                        }),
                      }}
                      onClick={() => selectScenario(scenario)}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" fontWeight={selectedId === scenario.id ? 600 : 400}>
                          {scenario.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(scenario.created_at).format('MMM D, YYYY')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Stack>
          </Paper>
        </Grid>

        {/* Center Panel - Scenario Builder */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Parameters</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => addParameter('hourlyRate')} startIcon={<AddIcon />}>
                    Hourly Rate
                  </Button>
                  <Button size="small" onClick={() => addParameter('scaleCategory')} startIcon={<AddIcon />}>
                    Scale Category
                  </Button>
                </Stack>
              </Stack>
            </Box>
            
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={scenarioParams.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <AnimatePresence>
                    {scenarioParams.map((param) => (
                      <motion.div
                        key={param.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SortableParam
                          param={param}
                          onUpdate={updateParameter}
                          onDelete={deleteParameter}
                          categories={categories}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </SortableContext>
                
                <DragOverlay>
                  {activeParam && (
                    <Card sx={{ opacity: 0.8, transform: 'rotate(5deg)' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Chip label={activeParam.name} size="small" />
                      </CardContent>
                    </Card>
                  )}
                </DragOverlay>
              </DndContext>
              
              {scenarioParams.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    Add parameters to build your scenario
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel - Results & Visualization */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Chart View" />
              <Tab label="Table View" />
            </Tabs>
            
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              {!result ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    Click "Compare" to see results
                  </Typography>
                </Box>
              ) : result.error ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
                  <Typography variant="body2">{result.error}</Typography>
                </Box>
              ) : tabValue === 0 ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Time Burn Comparison (hours/month)</Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="baseline"
                        stackId="1"
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.main}
                        fillOpacity={0.3}
                        name="Baseline"
                      />
                      <Area
                        type="monotone"
                        dataKey="scenario"
                        stackId="2"
                        stroke={theme.palette.secondary.main}
                        fill={theme.palette.secondary.main}
                        fillOpacity={0.3}
                        name="Scenario"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  <Typography variant="subtitle2" sx={{ mb: 2, mt: 3 }}>Difference (hours/month)</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="diff"
                        fill={theme.palette.success.main}
                        name="Time Saved"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <Card sx={{ mt: 2, bgcolor: 'background.default' }}>
                    <CardContent>
                      <Typography variant="body2" fontWeight={600}>
                        Net Savings: {(result.diff?.netSavingsHoursPerMonthDelta ?? 0).toFixed(1)} h/month
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ) : (
                <Box>
                  {/* Table view would go here */}
                  <Typography variant="body2">Table view coming soon...</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}