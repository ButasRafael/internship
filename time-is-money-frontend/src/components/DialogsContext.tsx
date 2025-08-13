import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

interface DialogsContextValue {
  confirm: (message: string, options?: {
    title?: string;
    okText?: string;
    cancelText?: string;
    severity?: 'error' | 'warning' | 'info' | 'success';
  }) => Promise<boolean>;
}

const DialogsContext = React.createContext<DialogsContextValue | null>(null);

interface DialogState {
  open: boolean;
  message: string;
  title?: string;
  okText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';  // ← added here
  resolve?: (value: boolean) => void;
}

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DialogState>({ open: false, message: '' });

  const confirm: DialogsContextValue['confirm'] = (message, options = {}) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, message, ...options, resolve });
    });
  };

  const handleClose = (result: boolean) => {
    if (state.resolve) state.resolve(result);
    setState({ open: false, message: '' });
  };

  return (
      <DialogsContext.Provider value={{ confirm }}>
        {children}
        <Dialog open={state.open} onClose={() => handleClose(false)}>
          <DialogTitle>{state.title ?? 'Confirm'}</DialogTitle>
          <DialogContent>{state.message}</DialogContent>
          <DialogActions>
            <Button onClick={() => handleClose(false)}>
              {state.cancelText ?? 'Cancel'}
            </Button>
            <Button
                variant="contained"
                color={state.severity ?? 'primary'}  // now valid
                onClick={() => handleClose(true)}
            >
              {state.okText ?? 'OK'}
            </Button>
          </DialogActions>
        </Dialog>
      </DialogsContext.Provider>
  );
}

export function useDialogs(): DialogsContextValue {
  const ctx = React.useContext(DialogsContext);
  if (!ctx) throw new Error('useDialogs must be used within DialogsProvider');
  return ctx;
}
