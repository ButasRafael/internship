import * as React from 'react';
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  gridClasses,
} from '@mui/x-data-grid';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Checkbox,
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNotifications } from './NotificationsContext';
import { useDialogs } from './DialogsContext';
import type { GridActionsCellItemProps } from '@mui/x-data-grid';

export interface CrudField<T> {
  name: keyof T & string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'file';
  options?: { label: string; value: any }[];
  accept?: string;
  required?: boolean;
}

export interface GenericCrudPageProps<T> {
  title: string;
  fetchList: () => Promise<T[]>;
  createItem: (data: any) => Promise<any>;
  updateItem: (id: any, data: any) => Promise<any>;
  deleteItem: (id: any) => Promise<any>;
  fields: CrudField<T>[];
  columns: GridColDef[];
  idField?: keyof T & string;
  transform?: (values: Partial<T>) => any;
  formatRows?: (rows: T[]) => T[];

  createDefaults?: Partial<T> | (() => Partial<T>);

  actions?: { create?: boolean; edit?: boolean; delete?: boolean };
  rowActions?: (row: T) => ReadonlyArray<React.ReactElement<GridActionsCellItemProps>>;
}

export default function GenericCrudPage<T extends Record<string, any>>(
    props: GenericCrudPageProps<T>,
) {
  const {
    title,
    fetchList,
    createItem,
    updateItem,
    deleteItem,
    fields,
    columns,
    idField = 'id',
    transform,
    formatRows,
    createDefaults,
  } = props;

  const act = React.useMemo(
      () => ({ create: true, edit: true, delete: true, ...(props.actions ?? {}) }),
      [props.actions]
  );

  const [rows, setRows] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [selectedRow, setSelectedRow] = React.useState<T | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null);
  const [formValues, setFormValues] = React.useState<Partial<T>>({});
  const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof T & string, string>>>({});
  const toYmd = (v: unknown) => {
    if (!v) return '';
    const d = dayjs(v as any);
    return d.isValid() ? d.format('YYYY-MM-DD') : String(v).slice(0, 10);
  };
  const dateFieldNames = React.useMemo(
      () => fields.filter(f => f.type === 'date').map(f => f.name),
      [fields]
  );

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchList();

      const formatted = (formatRows ? formatRows(data) : data).map((row) => {
        const r: any = { ...row };
        for (const key of dateFieldNames) {
          if (key in r) r[key] = toYmd(r[key]);
        }
        return r;
      });

      setRows(formatted as T[]);
    } catch (err: any) {
      setError(err);
    }
    setLoading(false);
  }, [fetchList, formatRows, dateFieldNames]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateClick = () => {
    const defaults =
        typeof createDefaults === 'function' ? createDefaults() : (createDefaults ?? {});
    setFormValues(defaults);
    setFormErrors({});
    setDialogMode('create');
  };

  const handleEditClick = (row: T) => () => {
    setSelectedRow(row);
    const partial: Partial<T> = {};
    fields.forEach((f) => {
      (partial as any)[f.name] = (row as any)[f.name];
    });
    setFormValues(partial);
    setFormErrors({});
    setDialogMode('edit');
  };

  const handleDeleteClick = (row: T) => async () => {
    let confirmed = true;
    if (dialogs) {
      confirmed = await dialogs.confirm('Delete this item?', {
        severity: 'error',
        okText: 'Delete',
        cancelText: 'Cancel',
      });
    } else {
      confirmed = window.confirm('Delete this item?');
    }
    if (!confirmed) return;

    try {
      await deleteItem((row as any)[idField]);
      notifications?.show('Item deleted.', { severity: 'success' });
      await loadData();
    } catch (err: any) {
      if (err.message?.includes('Unexpected end of JSON')) {
        notifications?.show('Item deleted.', { severity: 'success' });
        await loadData();
      } else {
        notifications?.show(`Delete failed: ${err.message}`, { severity: 'error' });
      }
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (values: Partial<T>) => {
    const errs: Partial<Record<keyof T & string, string>> = {};
    fields.forEach((field) => {
      const isReq = field.required ?? true;
      if (!isReq) return;

      const v = (values as any)[field.name];

      if (field.type === 'file') {
        if (dialogMode === 'create' && !(v instanceof File)) {
          errs[field.name] = `${field.label} is required`;
        }
        return;
      }
      if (field.type === 'number') {
        if (v === '' || v == null) errs[field.name] = `${field.label} is required`;
      } else if (field.type === 'boolean') {
        if (v == null) errs[field.name] = `${field.label} is required`;
      } else {
        if (v == null || v === '') errs[field.name] = `${field.label} is required`;
      }
    });
    return errs;
  };

  const handleDialogClose = () => {
    setDialogMode(null);
    setSelectedRow(null);
  };

  const handleDialogSubmit = async () => {
    const errs = validate(formValues);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const buildPayload = (values: Partial<T>) => {
      const result: any = {};
      fields.forEach((field) => {
        const v: any = (values as any)[field.name];
        switch (field.type) {
          case 'number':
            result[field.name] = (v === '' || v == null) ? null : Number(v);
            break;
          case 'date':
            result[field.name] = v ? String(v).slice(0, 10) : null;
            break;
          case 'boolean':
            result[field.name] = v == null ? false : Boolean(v);
            break;
          case 'file':
            result[field.name] = v instanceof File ? v : null;
            break;
          default:
            result[field.name] = v;
        }
      });
      return result;
    };

    let payload: any = transform ? transform(formValues) : buildPayload(formValues);

    const containsFile = Object.values(payload ?? {}).some((v: any) => v instanceof File);

    if (containsFile && !(payload instanceof FormData)) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined) return;
        if (v === null) {
          fd.append(k, '');
        } else if (v instanceof File) {
          fd.append(k, v);
        } else {
          fd.append(k, String(v));
        }
      });
      payload = fd;
    }
    try {
      if (dialogMode === 'create') {
        await createItem(payload);
        if (notifications) notifications.show('Item created.', { severity: 'success' });
      } else if (dialogMode === 'edit' && selectedRow) {
        await updateItem((selectedRow as any)[idField], payload);
        if (notifications) notifications.show('Item updated.', { severity: 'success' });
      }
      handleDialogClose();
      await loadData();
    } catch (err: any) {
      if (notifications) notifications.show(`Save failed: ${err.message}`, { severity: 'error' });
      else console.error(err);
    }
  };

  const cols = React.useMemo<GridColDef[]>(() => {
    const hasCustom = Boolean(props.rowActions);

    if (act.edit === false && act.delete === false && !hasCustom) {
      return [...columns];
    }

    const actionCol: GridColDef = {
      field: '__actions__',
      headerName: '',
      type: 'actions',
      width: 100,
      getActions: ({ row }): ReadonlyArray<React.ReactElement<GridActionsCellItemProps>> => {
        const items: Array<React.ReactElement<GridActionsCellItemProps>> = [];

        if (props.rowActions) {
          items.push(...props.rowActions(row as T));
        }

        if (act.edit !== false) {
          items.push(
              <GridActionsCellItem
                  key="edit"
                  icon={<EditIcon />}
                  label="Edit"
                  onClick={handleEditClick(row as T)}
              />
          );
        }
        if (act.delete !== false) {
          items.push(
              <GridActionsCellItem
                  key="delete"
                  icon={<DeleteIcon />}
                  label="Delete"
                  onClick={handleDeleteClick(row as T)}
              />
          );
        }

        return items as ReadonlyArray<React.ReactElement<GridActionsCellItemProps>>;
      },
    };

    return [...columns, actionCol];
  }, [columns, props.rowActions, act, handleEditClick, handleDeleteClick]);


  let notifications: { show: (msg: any, opts?: any) => string } | undefined;
  let dialogs: { confirm: (msg: string, opts?: any) => Promise<boolean> } | undefined;
  try {
    notifications = useNotifications();
  } catch {
    notifications = undefined;
  }
  try {
    dialogs = useDialogs();
  } catch {
    dialogs = undefined;
  }

  return (
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Reload data">
              <IconButton onClick={() => !loading && loadData()}><RefreshIcon /></IconButton>
            </Tooltip>
            {act.create !== false && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
                  Create
                </Button>
            )}
          </Stack>
          <Box component="h2" sx={{ m: 0, p: 0 }}>{title}</Box>
        </Stack>
        {error ? (
            <Alert severity="error">{error.message}</Alert>
        ) : (
            <DataGrid
                rows={rows}
                columns={cols}
                getRowId={(row) => (row as any)[idField] as any}
                loading={loading}
                autoHeight
                showToolbar
                slotProps={{ toolbar: { showQuickFilter: true } }}
                pagination
                pageSizeOptions={[5, 10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  sorting: { sortModel: [] },
                }}
                rowHeight={ 64 }
                sx={{
                  [`& .${gridClasses.row}:hover`]: { cursor: 'pointer' },
                }}
            />
        )}
        <Dialog open={dialogMode !== null} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>{dialogMode === 'create' ? `Create ${title}` : `Edit ${title}`}</DialogTitle>
          <DialogContent>
            {fields.map((field) => {
              const value = (formValues as any)[field.name];
              const error = (formErrors as any)[field.name];
              switch (field.type) {
                case 'text':
                  return (
                      <TextField
                          key={field.name}
                          label={field.label}
                          value={value ?? ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          fullWidth
                          margin="normal"
                          error={Boolean(error)}
                          helperText={error || ' '}
                          required={field.required ?? true}
                      />
                  );
                case 'number':
                  return (
                      <TextField
                          key={field.name}
                          label={field.label}
                          type="number"
                          value={value ?? ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
                          fullWidth
                          margin="normal"
                          error={Boolean(error)}
                          helperText={error || ' '}
                          required={field.required ?? true}
                      />
                  );
                case 'boolean':
                  return (
                      <FormControl
                          key={field.name}
                          margin="normal"
                          error={Boolean(error)}
                      >
                        <FormControlLabel
                            control={<Checkbox checked={Boolean(value)} onChange={(_e, checked) => handleFieldChange(field.name, checked)} />}
                            label={field.label}
                        />
                        <FormHelperText>{error || ' '}</FormHelperText>
                      </FormControl>
                  );
                case 'select':
                  return (
                      <FormControl
                          key={field.name}
                          fullWidth
                          margin="normal"
                          error={Boolean(error)}
                          required={field.required ?? true}
                      >
                        <InputLabel id={`${field.name}-label`} required={field.required ?? true}>
                          {field.label}
                        </InputLabel>
                        <Select
                            labelId={`${field.name}-label`}
                            value={value ?? ''}
                            label={field.label}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        >
                          {field.options?.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{error || ' '}</FormHelperText>
                      </FormControl>
                  );
                case 'date':
                  return (
                      <LocalizationProvider key={field.name} dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label={field.label}
                            value={value ? dayjs(value) : null}
                            onChange={(newValue) => {
                              if (!newValue || !newValue.isValid()) handleFieldChange(field.name, null);
                              else handleFieldChange(field.name, newValue.format('YYYY-MM-DD'));
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                margin: 'normal',
                                error: Boolean(error),
                                helperText: error || ' ',
                                required: field.required ?? true,
                              },
                            }}
                        />
                      </LocalizationProvider>
                  );
                case 'file':
                  return (
                      <FormControl key={field.name} margin="normal" error={Boolean(error)}>
                        <Button variant="outlined" component="label">
                          {value instanceof File ? `Selected: ${value.name}` : field.label}
                          <input
                              hidden
                              type="file"
                              accept={field.accept ?? 'image/*'}
                              onChange={(e) => {
                                const file = e.currentTarget.files?.[0] ?? null;
                                handleFieldChange(field.name, file);
                              }}
                          />
                        </Button>
                        <FormHelperText>{error || ' '}</FormHelperText>
                      </FormControl>
                  );
                default:
                  return null;
              }
            })}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button variant="contained" onClick={handleDialogSubmit}>Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
}