import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  Switch,
  FormControlLabel,
  Avatar,
  LinearProgress,
  Tooltip,
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
import { AnimatedCard, AnimatedChart } from '@/components/ui/AnimatedComponents';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie
} from 'recharts';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import dayjs from 'dayjs';

type ScenarioRow = { id: number; name: string; params_json: any; created_at: string };
type Category = { id: number; name: string; kind: 'expense' | 'object' | 'activity' | 'mixed' };

interface ScenarioVariable {
  id: string;
  type: 'hourlyRate' | 'scaleCategory' | 'addExpense' | 'addIncome' | 'addObject' | 'addActivity' | 'budgetOverride' | 'timeMultiplier' | 'efficiencyBoost';
  name: string;
  description: string;
  data: any;
  enabled: boolean;
  category?: string;
}

interface VariableTemplate {
  type: ScenarioVariable['type'];
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  defaultData: any;
  category: 'financial' | 'time' | 'efficiency' | 'resources';
}

const VARIABLE_TEMPLATES: VariableTemplate[] = [
  {
    type: 'hourlyRate',
    name: 'Hourly Rate Change',
    description: 'Adjust your hourly rate for specific months',
    icon: <AttachMoneyIcon />,
    color: '#4caf50',
    category: 'financial',
    defaultData: { month: dayjs().format('YYYY-MM'), rate: 100 }
  },
  {
    type: 'scaleCategory',
    name: 'Category Scale',
    description: 'Scale expenses, activities, or objects by percentage',
    icon: <SpeedIcon />,
    color: '#ff9800',
    category: 'efficiency',
    defaultData: { kind: 'expense', category_id: 0, factor: 1.2, description: '' }
  },
  {
    type: 'addExpense',
    name: 'New Expense',
    description: 'Add a hypothetical recurring expense',
    icon: <TrendingDownIcon />,
    color: '#f44336',
    category: 'financial',
    defaultData: { 
      amount_cents: 50000, // $500
      currency: 'RON', 
      frequency: 'monthly',
      description: 'New monthly expense',
      category_id: 0
    }
  },
  {
    type: 'addIncome',
    name: 'New Income',
    description: 'Add a hypothetical income source',
    icon: <TrendingUpIcon />,
    color: '#4caf50',
    category: 'financial',
    defaultData: { 
      amount_cents: 200000, // $2000
      currency: 'RON', 
      recurring: 'monthly',
      description: 'Additional income stream',
      source: 'Side Project'
    }
  },
  {
    type: 'addObject',
    name: 'New Object/Tool',
    description: 'Add a time-saving tool or equipment',
    icon: <CategoryIcon />,
    color: '#00bcd4',
    category: 'resources',
    defaultData: { 
      name: 'Productivity Tool',
      price_cents: 100000, // $1000
      currency: 'RON',
      expected_life_months: 24,
      maintenance_cents_per_month: 1000,
      hours_saved_per_month: 5,
      category_id: 0
    }
  },
  {
    type: 'addActivity',
    name: 'New Activity',
    description: 'Add a recurring activity or task',
    icon: <TimelineIcon />,
    color: '#ff5722',
    category: 'time',
    defaultData: { 
      name: 'New Task',
      duration_minutes: 60,
      frequency: 'weekly',
      direct_cost_cents: 0,
      saved_minutes: 0,
      currency: 'RON',
      category_id: 0
    }
  },
  {
    type: 'timeMultiplier',
    name: 'Time Efficiency',
    description: 'Simulate time-saving improvements (automation, tools, etc.)',
    icon: <AccessTimeIcon />,
    color: '#2196f3',
    category: 'time',
    defaultData: { multiplier: 1.5, applies_to: 'all', description: 'Automation saves 33% time' }
  },
  {
    type: 'efficiencyBoost',
    name: 'Productivity Boost',
    description: 'Model productivity improvements that reduce costs',
    icon: <SpeedIcon />,
    color: '#9c27b0',
    category: 'efficiency',
    defaultData: { boost_percentage: 25, applies_to: 'activities', description: 'Better tools increase productivity' }
  }
];

interface SortableVariableProps {
  variable: ScenarioVariable;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  categories: Category[];
}

function SortableVariable({ variable, onUpdate, onDelete, onToggle, categories }: SortableVariableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: variable.id,
  });
  const [expanded, setExpanded] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const template = VARIABLE_TEMPLATES.find(t => t.type === variable.type);

  const renderVariableContent = () => {
    switch (variable.type) {
      case 'hourlyRate':
        return (
          <Stack spacing={2}>
            <TextField
              type="month"
              label="Month"
              size="small"
              value={variable.data.month || dayjs().format('YYYY-MM')}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, month: e.target.value })}
              fullWidth
            />
            <TextField
              type="number"
              label="Hourly Rate"
              size="small"
              value={variable.data.rate || 100}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, rate: Number(e.target.value) })}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
              fullWidth
            />
          </Stack>
        );
        
      case 'scaleCategory':
        return (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={variable.data.kind || 'expense'}
                    label="Type"
                    onChange={(e) => onUpdate(variable.id, { ...variable.data, kind: e.target.value })}
                  >
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="activity">Activity</MenuItem>
                    <MenuItem value="object">Object</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={variable.data.category_id || categories[0]?.id || 0}
                    label="Category"
                    onChange={(e) => onUpdate(variable.id, { ...variable.data, category_id: Number(e.target.value) })}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box>
              <Typography variant="body2" gutterBottom>
                Scale Factor: {(variable.data.factor * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={variable.data.factor}
                min={0.1}
                max={3.0}
                step={0.1}
                onChange={(_, value) => onUpdate(variable.id, { ...variable.data, factor: value as number })}
                marks={[
                  { value: 0.5, label: '50%' },
                  { value: 1.0, label: '100%' },
                  { value: 1.5, label: '150%' },
                  { value: 2.0, label: '200%' }
                ]}
              />
            </Box>
            <TextField
              label="Description"
              size="small"
              value={variable.data.description || ''}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, description: e.target.value })}
              placeholder="e.g., Remote work reduces commute costs"
              fullWidth
            />
          </Stack>
        );
        
      case 'addExpense':
        return (
          <Stack spacing={2}>
            <TextField
              label="Description"
              size="small"
              value={variable.data.description || 'New expense'}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, description: e.target.value })}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Amount"
                  size="small"
                  value={(variable.data.amount_cents || 0) / 100}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, amount_cents: Number(e.target.value) * 100 })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{variable.data.currency || 'RON'}</Typography>
                  }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={variable.data.frequency || 'monthly'}
                    label="Frequency"
                    onChange={(e) => onUpdate(variable.id, { ...variable.data, frequency: e.target.value })}
                  >
                    <MenuItem value="once">One-time</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="date"
                  label="Start Date"
                  size="small"
                  value={variable.data.start_date || dayjs().format('YYYY-MM-DD')}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="date"
                  label="End Date (Optional)"
                  size="small"
                  value={variable.data.end_date || ''}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, end_date: e.target.value || null })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={variable.data.category_id ?? ''}
                label="Category"
                onChange={(e) => onUpdate(variable.id, { ...variable.data, category_id: e.target.value ? Number(e.target.value) : null })}
              >
                <MenuItem value="">None</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        );
        
      case 'addIncome':
        return (
          <Stack spacing={2}>
            <TextField
              label="Source"
              size="small"
              value={variable.data.source || 'Side Project'}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, source: e.target.value })}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Amount"
                  size="small"
                  value={(variable.data.amount_cents || 0) / 100}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, amount_cents: Number(e.target.value) * 100 })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{variable.data.currency || 'RON'}</Typography>
                  }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={variable.data.recurring || 'monthly'}
                    label="Frequency"
                    onChange={(e) => onUpdate(variable.id, { ...variable.data, recurring: e.target.value })}
                  >
                    <MenuItem value="none">One-time</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              type="date"
              label="Received Date"
              size="small"
              value={variable.data.received_at || dayjs().format('YYYY-MM-DD')}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, received_at: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Description"
              size="small"
              value={variable.data.description || ''}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, description: e.target.value })}
              placeholder="e.g., Freelance project income"
              fullWidth
            />
          </Stack>
        );
        
      case 'addObject':
        return (
          <Stack spacing={2}>
            <TextField
              label="Object Name"
              size="small"
              value={variable.data.name || 'Productivity Tool'}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, name: e.target.value })}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Purchase Price"
                  size="small"
                  value={(variable.data.price_cents || 0) / 100}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, price_cents: Number(e.target.value) * 100 })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{variable.data.currency || 'RON'}</Typography>
                  }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Life (months)"
                  size="small"
                  value={variable.data.expected_life_months || 24}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, expected_life_months: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Maintenance Cost/Month"
                  size="small"
                  value={(variable.data.maintenance_cents_per_month || 0) / 100}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, maintenance_cents_per_month: Number(e.target.value) * 100 })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{variable.data.currency || 'RON'}</Typography>
                  }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Hours Saved/Month"
                  size="small"
                  value={variable.data.hours_saved_per_month || 0}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, hours_saved_per_month: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              type="date"
              label="Purchase Date"
              size="small"
              value={variable.data.purchase_date || dayjs().format('YYYY-MM-DD')}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, purchase_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={variable.data.category_id ?? ''}
                label="Category"
                onChange={(e) => onUpdate(variable.id, { ...variable.data, category_id: e.target.value ? Number(e.target.value) : null })}
              >
                <MenuItem value="">None</MenuItem>
                {categories.filter(cat => cat.kind === 'object' || cat.kind === 'mixed').map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        );
        
      case 'addActivity':
        return (
          <Stack spacing={2}>
            <TextField
              label="Activity Name"
              size="small"
              value={variable.data.name || 'New Task'}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, name: e.target.value })}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Duration (minutes)"
                  size="small"
                  value={variable.data.duration_minutes || 60}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, duration_minutes: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={variable.data.frequency || 'monthly'}
                    label="Frequency"
                    onChange={(e) => onUpdate(variable.id, { ...variable.data, frequency: e.target.value })}
                  >
                    <MenuItem value="once">One-time</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Direct Cost"
                  size="small"
                  value={(variable.data.direct_cost_cents || 0) / 100}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, direct_cost_cents: Number(e.target.value) * 100 })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{variable.data.currency || 'RON'}</Typography>
                  }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  type="number"
                  label="Minutes Saved"
                  size="small"
                  value={variable.data.saved_minutes || 0}
                  onChange={(e) => onUpdate(variable.id, { ...variable.data, saved_minutes: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={variable.data.category_id ?? ''}
                label="Category"
                onChange={(e) => onUpdate(variable.id, { ...variable.data, category_id: e.target.value ? Number(e.target.value) : null })}
              >
                <MenuItem value="">None</MenuItem>
                {categories.filter(cat => cat.kind === 'activity' || cat.kind === 'mixed').map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        );
        
      case 'timeMultiplier':
        return (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Time Multiplier: {variable.data.multiplier?.toFixed(1)}x
              </Typography>
              <Slider
                value={variable.data.multiplier || 1.0}
                min={0.5}
                max={2.0}
                step={0.1}
                onChange={(_, value) => onUpdate(variable.id, { ...variable.data, multiplier: value as number })}
                marks={[
                  { value: 0.5, label: '0.5x' },
                  { value: 1.0, label: '1x' },
                  { value: 1.5, label: '1.5x' },
                  { value: 2.0, label: '2x' }
                ]}
              />
            </Box>
            <TextField
              label="Description"
              size="small"
              value={variable.data.description || ''}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, description: e.target.value })}
              placeholder="e.g., Automation reduces task time"
              fullWidth
            />
          </Stack>
        );
        
      case 'efficiencyBoost':
        return (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Efficiency Boost: {variable.data.boost_percentage || 20}%
              </Typography>
              <Slider
                value={variable.data.boost_percentage || 20}
                min={5}
                max={100}
                step={5}
                onChange={(_, value) => onUpdate(variable.id, { ...variable.data, boost_percentage: value as number })}
                marks={[
                  { value: 20, label: '20%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' }
                ]}
              />
            </Box>
            <TextField
              label="Description"
              size="small"
              value={variable.data.description || ''}
              onChange={(e) => onUpdate(variable.id, { ...variable.data, description: e.target.value })}
              placeholder="e.g., Better tools increase productivity"
              fullWidth
            />
          </Stack>
        );
        
      default:
        return <Typography variant="body2">Unknown variable type</Typography>;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        opacity: variable.enabled ? 1 : 0.6,
        borderLeft: template ? `4px solid ${template.color}` : undefined,
        '&:hover': { boxShadow: 3 },
        transition: 'all 0.2s',
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <DragIndicatorIcon {...attributes} {...listeners} sx={{ color: 'text.secondary', cursor: 'grab' }} />
          
          <Avatar sx={{ width: 32, height: 32, bgcolor: template?.color }}>
            {template?.icon}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={600}>
                {variable.name}
              </Typography>
              <Chip 
                label={template?.category} 
                size="small" 
                sx={{ bgcolor: template?.color, color: 'white', fontSize: '0.6rem' }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {variable.description}
            </Typography>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={variable.enabled}
                onChange={() => onToggle(variable.id)}
                size="small"
              />
            }
            label=""
          />
          
          <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </IconButton>
          </Tooltip>
          
          <IconButton size="small" onClick={() => onDelete(variable.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Stack>
        
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {renderVariableContent()}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function EnhancedScenarioBuilderPage() {
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
  
  // Enhanced scenario variables
  const [scenarioVariables, setScenarioVariables] = useState<ScenarioVariable[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState<string>('all');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Load data
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
    
    // Convert existing params to enhanced format
    const variables: ScenarioVariable[] = [];
    const paramsJson = sc.params_json || {};
    
    // Convert hourly rates
    Object.entries(paramsJson.hourlyRates || {}).forEach(([month, rate], idx) => {
      variables.push({
        id: `hr-${idx}`,
        type: 'hourlyRate',
        name: 'Hourly Rate Change',
        description: `Rate change for ${month}`,
        data: { month, rate },
        enabled: true,
        category: 'financial',
      });
    });
    
    // Convert scale by category
    (paramsJson.scaleByCategory || []).forEach((scale: any, idx: number) => {
      const category = categories.find(c => c.id === scale.category_id);
      variables.push({
        id: `scale-${idx}`,
        type: 'scaleCategory',
        name: 'Category Scale',
        description: `Scale ${category?.name || 'category'} by ${(scale.factor * 100).toFixed(0)}%`,
        data: scale,
        enabled: true,
        category: 'efficiency',
      });
    });
    
    setScenarioVariables(variables);
  }

  async function createScenario() {
    const name = `Enhanced Scenario ${scenarios.length + 1}`;
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
      // Convert enhanced variables back to API format
      const paramsJson: any = { 
        hourlyRates: {}, 
        scaleByCategory: [],
        expenses_add: [],
        incomes_add: [],
        activities_add: [],
        objects_add: []
      };
      
      scenarioVariables.forEach(variable => {
        if (!variable.enabled) return;
        
        switch (variable.type) {
          case 'hourlyRate':
            paramsJson.hourlyRates[variable.data.month] = variable.data.rate;
            break;
            
          case 'scaleCategory':
            paramsJson.scaleByCategory.push(variable.data);
            break;
            
          case 'addExpense':
            paramsJson.expenses_add.push({
              amount_cents: variable.data.amount_cents,
              currency: variable.data.currency,
              frequency: variable.data.frequency,
              start_date: variable.data.start_date || from + '-01', // Use scenario start date or custom date
              end_date: variable.data.end_date || null, // Optional end date
              is_active: 1, // Must be 1 for active (not true)
              category_id: variable.data.category_id || null
            });
            break;
            
          case 'addIncome':
            // For recurring income, use the start of the period
            // For one-time income, use the specific date within the period
            const incomeDate = variable.data.recurring === 'none' 
              ? (variable.data.received_at || from + '-15') // Middle of month for one-time
              : from + '-01'; // Start of period for recurring
              
            paramsJson.incomes_add.push({
              received_at: incomeDate,
              amount_cents: variable.data.amount_cents || 0,
              currency: variable.data.currency || 'RON',
              source: variable.data.source || 'Scenario Income',
              recurring: variable.data.recurring || 'monthly'
            });
            console.log('Adding income:', {
              received_at: incomeDate,
              amount_cents: variable.data.amount_cents,
              recurring: variable.data.recurring,
              source: variable.data.source
            });
            break;
            
          case 'addObject':
            paramsJson.objects_add.push({
              name: variable.data.name || 'New Object',
              price_cents: variable.data.price_cents || 0,
              currency: variable.data.currency || 'RON',
              purchase_date: variable.data.purchase_date || from + '-01',
              expected_life_months: variable.data.expected_life_months || 24,
              maintenance_cents_per_month: variable.data.maintenance_cents_per_month || 0,
              hours_saved_per_month: variable.data.hours_saved_per_month || 0,
              category_id: variable.data.category_id || null
            });
            break;
            
          case 'addActivity':
            paramsJson.activities_add.push({
              name: variable.data.name || 'New Activity',
              duration_minutes: variable.data.duration_minutes || 60,
              frequency: variable.data.frequency || 'monthly',
              direct_cost_cents: variable.data.direct_cost_cents || 0,
              saved_minutes: variable.data.saved_minutes || 0,
              currency: variable.data.currency || 'RON',
              category_id: variable.data.category_id || null
            });
            break;
            
          case 'timeMultiplier':
            // Apply time multiplier to all activity categories
            const timeMultiplier = 1 / (variable.data.multiplier || 1); // Inverse for efficiency
            categories.forEach(cat => {
              if (cat.kind === 'activity' || cat.kind === 'mixed') {
                paramsJson.scaleByCategory.push({
                  kind: 'activity',
                  category_id: cat.id,
                  factor: timeMultiplier
                });
              }
            });
            break;
            
          case 'efficiencyBoost':
            // Apply efficiency boost by scaling down activity costs across all categories
            const boostFactor = 1 - ((variable.data.boost_percentage || 20) / 100);
            categories.forEach(cat => {
              if (cat.kind === 'activity' || cat.kind === 'mixed') {
                paramsJson.scaleByCategory.push({
                  kind: 'activity',
                  category_id: cat.id,
                  factor: boostFactor
                });
              }
            });
            break;
        }
      });
      
      // Debug: Log what we're sending to the API
      console.log('🚀 Sending scenario payload:', {
        from, to,
        params_json: paramsJson,
        active_variables: scenarioVariables.filter(v => v.enabled).map(v => ({
          type: v.type,
          name: v.name,
          data: v.data
        }))
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

  function addVariable(templateType: ScenarioVariable['type']) {
    const template = VARIABLE_TEMPLATES.find(t => t.type === templateType)!;
    const id = `${templateType}-${Date.now()}`;
    const newVariable: ScenarioVariable = {
      id,
      type: templateType,
      name: template.name,
      description: template.description,
      data: { ...template.defaultData },
      enabled: true,
      category: template.category,
    };
    setScenarioVariables([...scenarioVariables, newVariable]);
  }

  function updateVariable(id: string, data: any) {
    setScenarioVariables(variables => variables.map(v => v.id === id ? { ...v, data } : v));
  }

  function deleteVariable(id: string) {
    setScenarioVariables(variables => variables.filter(v => v.id !== id));
  }

  function toggleVariable(id: string) {
    setScenarioVariables(variables => variables.map(v => v.id === id ? { ...v, enabled: !v.enabled } : v));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setScenarioVariables(variables => {
        const oldIndex = variables.findIndex(v => v.id === active.id);
        const newIndex = variables.findIndex(v => v.id === over.id);
        return arrayMove(variables, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  }

  // Enhanced chart data
  const chartData = useMemo(() => {
    if (!result?.months) return [];
    
    return result.months.map((month: string) => ({
      month,
      baseline: result.baseline?.timeBurnNet?.[month] ?? 0,
      scenario: result.scenario?.timeBurnNet?.[month] ?? 0,
      diff: result.diff?.timeBurnNet?.[month] ?? 0,
      savings: Math.max(0, -(result.diff?.timeBurnNet?.[month] ?? 0)),
      cost: Math.max(0, result.diff?.timeBurnNet?.[month] ?? 0),
      // Add income data to chart
      baselineIncome: result.baseline?.incomeMoney?.[month] ?? 0,
      scenarioIncome: result.scenario?.incomeMoney?.[month] ?? 0,
      incomeDiff: result.diff?.incomeMoney?.[month] ?? 0,
    }));
  }, [result]);

  const summaryStats = useMemo(() => {
    if (!result?.diff) return null;
    
    const totalSavings = chartData.reduce((sum: number, d: any) => sum + d.savings, 0);
    const totalCost = chartData.reduce((sum: number, d: any) => sum + d.cost, 0);
    const netSavings = result.diff?.netSavingsHoursPerMonthDelta ?? 0;
    const avgMonthlyImpact = chartData.length > 0 ? chartData.reduce((sum: number, d: any) => sum + d.diff, 0) / chartData.length : 0;
    
    return {
      totalSavings,
      totalCost,
      netSavings,
      avgMonthlyImpact,
      efficiency: totalCost > 0 ? (totalSavings / totalCost) * 100 : 0,
      trend: netSavings > 0 ? 'positive' : netSavings < 0 ? 'negative' : 'neutral'
    };
  }, [chartData, result]);

  const filteredTemplates = templateCategory === 'all' 
    ? VARIABLE_TEMPLATES 
    : VARIABLE_TEMPLATES.filter(t => t.category === templateCategory);

  const activeVariable = scenarioVariables.find(v => v.id === activeId);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <TimelineIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Enhanced Scenario Builder
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Build complex scenarios with advanced variables and real-time comparisons
              </Typography>
            </Box>
          </Stack>
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
              size="large"
              onClick={evaluate}
              disabled={loading || !selectedId}
              startIcon={loading ? <LinearProgress sx={{ width: 20 }} /> : <CompareArrowsIcon />}
            >
              {loading ? 'Analyzing...' : 'Analyze Scenario'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2} columns={12} sx={{ flex: 1 }}>
        {/* Left Panel - Scenarios & Templates */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            {/* Scenarios List */}
            <Paper sx={{ p: 2, flex: '0 0 auto' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Scenarios</Typography>
                <Button size="small" variant="contained" onClick={createScenario} startIcon={<AddIcon />}>
                  New
                </Button>
              </Stack>
              <Stack spacing={1}>
                <AnimatePresence>
                  {scenarios.slice(0, 5).map((scenario) => (
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
                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
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

            {/* Variable Templates */}
            <Paper sx={{ p: 2, flex: 1, minHeight: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Add Variables</Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="financial">Financial</MenuItem>
                    <MenuItem value="time">Time</MenuItem>
                    <MenuItem value="efficiency">Efficiency</MenuItem>
                    <MenuItem value="resources">Resources</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              
              <Stack spacing={1} sx={{ maxHeight: '100%', overflow: 'auto' }}>
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.type}
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { boxShadow: 1, borderColor: template.color },
                      transition: 'all 0.2s'
                    }}
                    onClick={() => addVariable(template.type)}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: template.color }}>
                          {template.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {template.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {template.description}
                          </Typography>
                        </Box>
                        <AddIcon fontSize="small" />
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Center Panel - Variable Builder */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Scenario Variables</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label={`${scenarioVariables.filter(v => v.enabled).length} Active`} 
                    color="primary" 
                    size="small" 
                  />
                  <Chip 
                    label={`${scenarioVariables.length} Total`} 
                    variant="outlined" 
                    size="small" 
                  />
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
                <SortableContext items={scenarioVariables.map(v => v.id)} strategy={verticalListSortingStrategy}>
                  <AnimatePresence>
                    {scenarioVariables.map((variable) => (
                      <motion.div
                        key={variable.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SortableVariable
                          variable={variable}
                          onUpdate={updateVariable}
                          onDelete={deleteVariable}
                          onToggle={toggleVariable}
                          categories={categories}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </SortableContext>
                
                <DragOverlay>
                  {activeVariable && (
                    <Card sx={{ opacity: 0.8, transform: 'rotate(5deg)' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {VARIABLE_TEMPLATES.find(t => t.type === activeVariable.type)?.icon}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {activeVariable.name}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </DragOverlay>
              </DndContext>
              
              {scenarioVariables.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <CategoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No Variables Added
                  </Typography>
                  <Typography variant="body2">
                    Click on variable templates to start building your scenario
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel - Enhanced Results */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Overview" />
              <Tab label="Charts" />
              <Tab label="Insights" />
            </Tabs>
            
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              {!result ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <VisibilityIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    Ready for Analysis
                  </Typography>
                  <Typography variant="body2">
                    Click "Analyze Scenario" to see detailed comparisons and insights
                  </Typography>
                </Box>
              ) : result.error ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
                  <Typography variant="body2">{result.error}</Typography>
                </Box>
              ) : tabValue === 0 ? (
                <Stack spacing={2}>
                  {summaryStats && (
                    <>
                      {/* Summary Cards */}
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Card sx={{ bgcolor: summaryStats.trend === 'positive' ? 'success.light' : 'error.light', color: 'white' }}>
                            <CardContent sx={{ py: 1.5 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {summaryStats.trend === 'positive' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                <Box>
                                  <Typography variant="h6" fontWeight={600}>
                                    {summaryStats.netSavings.toFixed(1)}h
                                  </Typography>
                                  <Typography variant="caption">
                                    Net Monthly Savings
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                            <CardContent sx={{ py: 1.5 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <SpeedIcon />
                                <Box>
                                  <Typography variant="h6" fontWeight={600}>
                                    {summaryStats.efficiency.toFixed(0)}%
                                  </Typography>
                                  <Typography variant="caption">
                                    Efficiency Ratio
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* Impact Overview */}
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>Impact Breakdown</Typography>
                          <Stack spacing={1}>
                            <Box>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Total Time Saved</Typography>
                                <Typography variant="body2" color="success.main" fontWeight={600}>
                                  +{summaryStats.totalSavings.toFixed(1)}h
                                </Typography>
                              </Stack>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(100, Math.max(0, (summaryStats.totalSavings / 40) * 100))}
                                sx={{ mt: 0.5, bgcolor: 'success.lighter' }}
                                color="success"
                              />
                            </Box>
                            <Box>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Total Time Cost</Typography>
                                <Typography variant="body2" color="error.main" fontWeight={600}>
                                  -{summaryStats.totalCost.toFixed(1)}h
                                </Typography>
                              </Stack>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(100, Math.max(0, (summaryStats.totalCost / 40) * 100))}
                                sx={{ mt: 0.5, bgcolor: 'error.lighter' }}
                                color="error"
                              />
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Quick Chart Preview */}
                  <AnimatedCard loading={loading} variant="lift" delay={0.3}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Time Impact Trend</Typography>
                      <AnimatedChart loading={loading} height={150} delay={0.4}>
                        <ResponsiveContainer width="100%" height={150}>
                          <ComposedChart data={chartData}>
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <CartesianGrid strokeDasharray="3 3" />
                            <RechartsTooltip />
                            <Bar dataKey="savings" fill={theme.palette.success.main} name="Savings" />
                            <Bar dataKey="cost" fill={theme.palette.error.main} name="Cost" />
                            <Line type="monotone" dataKey="diff" stroke={theme.palette.primary.main} name="Net" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </AnimatedChart>
                    </CardContent>
                  </AnimatedCard>
                </Stack>
              ) : tabValue === 1 ? (
                <Stack spacing={2}>
                  {/* Detailed Charts */}
                  <AnimatedCard loading={loading} variant="lift" delay={0.5}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Baseline vs Scenario Comparison</Typography>
                      <AnimatedChart loading={loading} height={250} delay={0.6}>
                        <ResponsiveContainer width="100%" height={250}>
                          <ComposedChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="baseline"
                            fill={theme.palette.grey[300]}
                            stroke={theme.palette.grey[500]}
                            name="Baseline"
                          />
                          <Area
                            type="monotone"
                            dataKey="scenario"
                            fill={theme.palette.primary.light}
                            stroke={theme.palette.primary.main}
                            name="Scenario"
                          />
                          <Line
                            type="monotone"
                            dataKey="diff"
                            stroke={theme.palette.secondary.main}
                            strokeWidth={3}
                            name="Difference"
                          />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </AnimatedChart>
                    </CardContent>
                  </AnimatedCard>

                  <AnimatedCard loading={loading} variant="lift" delay={0.7}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Income Changes</Typography>
                      <AnimatedChart loading={loading} height={200} delay={0.8}>
                        <ResponsiveContainer width="100%" height={200}>
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="baselineIncome" fill={theme.palette.grey[400]} name="Baseline Income" />
                            <Bar dataKey="scenarioIncome" fill={theme.palette.success.main} name="Scenario Income" />
                            <Line type="monotone" dataKey="incomeDiff" stroke={theme.palette.primary.main} name="Difference" strokeWidth={2} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </AnimatedChart>
                    </CardContent>
                  </AnimatedCard>
                  
                  <AnimatedCard loading={loading} variant="lift" delay={0.9}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Impact Distribution</Typography>
                      <AnimatedChart loading={loading} height={200} delay={1.0}>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                          <Pie
                            data={[
                              { name: 'Time Saved', value: summaryStats?.totalSavings || 0, fill: theme.palette.success.main },
                              { name: 'Time Cost', value: summaryStats?.totalCost || 0, fill: theme.palette.error.main }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${(value || 0).toFixed(1)}h`}
                          />
                          </PieChart>
                        </ResponsiveContainer>
                      </AnimatedChart>
                    </CardContent>
                  </AnimatedCard>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {/* AI-like Insights */}
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Key Insights</Typography>
                      <Stack spacing={2}>
                        <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                          <Typography variant="body2">
                            💡 <strong>Best Month:</strong> {chartData.reduce((best: any, curr: any) => 
                              curr.diff < best.diff ? curr : best, chartData[0] || {})?.month || 'N/A'} 
                            shows the highest time savings
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                          <Typography variant="body2">
                            ⚠️ <strong>Watch Out:</strong> Variables affecting {categories.length > 0 ? categories[0].name : 'expenses'} 
                            have the highest impact on your scenario
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                          <Typography variant="body2">
                            ✨ <strong>Optimization:</strong> Consider adding efficiency boosts to amplify your time savings
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Scenario Health Score</Typography>
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h3" color="primary" fontWeight={600}>
                          {Math.round(Math.min(100, Math.max(0, 50 + (summaryStats?.netSavings || 0) * 2)))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Overall Score
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(100, Math.max(0, 50 + (summaryStats?.netSavings || 0) * 2))}
                          sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}