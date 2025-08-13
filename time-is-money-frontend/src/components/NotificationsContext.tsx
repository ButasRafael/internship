import * as React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface NotificationOptions {
  severity?: 'error' | 'warning' | 'info' | 'success';
  autoHideDuration?: number;
  actionText?: string;
  onAction?: () => void;
}

interface NotificationEntry {
  key: string;
  message: React.ReactNode;
  options: NotificationOptions;
}

interface NotificationsContextValue {
  show: (message: React.ReactNode, options?: NotificationOptions) => string;
  close: (key: string) => void;
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<NotificationEntry[]>([]);
  const [current, setCurrent] = React.useState<NotificationEntry | null>(null);

  const processQueue = React.useCallback(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((prev) => prev.slice(1));
  }, [current, queue]);

  React.useEffect(() => {
    processQueue();
  }, [queue, processQueue]);

  const show = React.useCallback<NotificationsContextValue['show']>((message, options = {}) => {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setQueue((prev) => [...prev, { key, message, options }]);
    return key;
  }, []);

  const close = React.useCallback<NotificationsContextValue['close']>((key) => {
    if (current?.key === key) {
      setCurrent(null);
    } else {
      setQueue((prev) => prev.filter((entry) => entry.key !== key));
    }
  }, [current]);

  const handleClose = (_event?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    if (current) {
      setCurrent(null);
    }
  };

  return (
    <NotificationsContext.Provider value={{ show, close }}>
      {children}
      {current && (
        <Snackbar
          key={current.key}
          open={true}
          autoHideDuration={current.options.autoHideDuration ?? 3000}
          onClose={handleClose}
        >
          <Alert
            onClose={() => handleClose()}
            severity={current.options.severity ?? 'info'}
            action={current.options.onAction ? (
              <button onClick={current.options.onAction} style={{ color: 'inherit', border: 0, background: 'none', cursor: 'pointer' }}>
                {current.options.actionText ?? 'Action'}
              </button>
            ) : undefined}
            sx={{ width: '100%' }}
          >
            {current.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}