import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/ui/PageTransition'

export default function AuthLayout() {
    const location = useLocation()
    return (
        <>
            <AnimatePresence mode="wait">
                <PageTransition key={location.pathname} variant="fade">
                    <Outlet />
                </PageTransition>
            </AnimatePresence>
        </>
    )
}
