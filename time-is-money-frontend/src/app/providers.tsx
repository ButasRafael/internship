import { CssBaseline, ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material'
import { SWRConfig } from 'swr'
import { type PropsWithChildren, useEffect, useMemo, useState, createContext, useContext } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/store/auth.store'
import { NotificationsProvider } from '@/components/NotificationsContext'
import { DialogsProvider } from '@/components/DialogsContext'

type Mode = 'light' | 'dark'
type ColorModeCtx = { mode: Mode; toggle: () => void; setMode: (m: Mode) => void }
const ColorModeContext = createContext<ColorModeCtx>({ mode: 'light', toggle: () => {}, setMode: () => {} })
export const useColorMode = () => useContext(ColorModeContext)

export function AppProviders({ children }: PropsWithChildren) {
    const [mode, setMode] = useState<Mode>(() => {
        const saved = localStorage.getItem('tim-theme') as Mode | null
        if (saved === 'light' || saved === 'dark') return saved
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })
    useEffect(() => { localStorage.setItem('tim-theme', mode) }, [mode])
    const toggle = () => setMode(m => (m === 'light' ? 'dark' : 'light'))

    const theme = useMemo(() => {
        let t = createTheme({
            palette: {
                mode,
                primary: { main: '#1E5EFF' },
                background: {
                    default: mode === 'dark' ? '#0B0F19' : '#F4F7FB',
                    paper:   mode === 'dark' ? '#101826' : '#fff',
                },
            },
            shape: { borderRadius: 16 },
            typography: {
                fontFamily: ['Inter','system-ui','Segoe UI','Roboto','Helvetica','Arial','sans-serif'].join(','),
                fontSize: 14,
                h4: { fontWeight: 700 },
                h5: { fontWeight: 700 },
                button: { textTransform: 'none', fontWeight: 600 },
            },
            components: {
                MuiPaper: {
                    styleOverrides: { root: { borderRadius: 20 } },
                    defaultProps: { elevation: 1 },
                },
                MuiTextField: {
                    defaultProps: { fullWidth: true, size: 'medium', variant: 'outlined' },
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            borderRadius: 14,
                            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.04)' : '#fff',
                            transition: 'box-shadow .18s ease, border-color .18s ease',
                            '&:has(input:focus)': { boxShadow: '0 0 0 4px rgba(30,94,255,.08)' },
                        },
                        notchedOutline: { borderColor: mode === 'dark' ? 'rgba(255,255,255,.16)' : '#E6EAF2' },
                        input: { paddingTop: 14, paddingBottom: 14 },
                    },
                },
                MuiButton: {
                    defaultProps: { variant: 'contained', disableElevation: true },
                    styleOverrides: {
                        root: {
                            height: 48,
                            borderRadius: 14,
                            transition: 'transform .18s ease, box-shadow .18s ease, background .2s ease',
                            boxShadow: '0 2px 0 rgba(0,0,0,.02)',
                            '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 10px 24px rgba(30,94,255,.18)' },
                            '&:active': { transform: 'translateY(0)', boxShadow: '0 4px 10px rgba(30,94,255,.16)' },
                        },
                    },
                },
                MuiAlert: { defaultProps: { variant: 'outlined' } },
            },
        })
        return responsiveFontSizes(t)
    }, [mode])

    return (
        <ColorModeContext.Provider value={{ mode, toggle, setMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <SWRConfig
                    value={{
                        fetcher: (key: string) => apiFetch(key),
                        revalidateOnFocus: false,
                        shouldRetryOnError: false,
                        onError: (err: any) => {
                            if (err?.status === 401) {
                                const { setAccessToken, setUser } = useAuth.getState()
                                setAccessToken(null)
                                setUser(null)
                            }
                        },
                        onErrorRetry: (err, _key, _config, revalidate, ctx) => {
                            if (err?.status === 401) return
                            if (ctx.retryCount >= 2) return
                            setTimeout(() => revalidate({ retryCount: ctx.retryCount + 1 }), 1500)
                        },
                    }}
                >
                    <NotificationsProvider>
                        <DialogsProvider>{children}</DialogsProvider>
                    </NotificationsProvider>
                </SWRConfig>
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}
