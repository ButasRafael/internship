import { motion, useReducedMotion, AnimatePresence, cubicBezier } from 'framer-motion'
import type {PropsWithChildren} from 'react'
import { Skeleton, Card, CardContent, Box } from '@mui/material'

const easeOutQuart = cubicBezier(0.25, 1, 0.5, 1)
const easeOutCirc = cubicBezier(0.08, 0.82, 0.17, 1)

interface AnimatedCardProps extends PropsWithChildren {
    loading?: boolean
    delay?: number
    variant?: 'fade' | 'slide' | 'scale' | 'lift'
    className?: string
    [key: string]: any // For MUI Card props
}

export function AnimatedCard({ 
    children, 
    loading = false, 
    delay = 0,
    variant = 'lift',
    className,
    ...cardProps 
}: AnimatedCardProps) {
    const prefersReduced = useReducedMotion()

    const variants = {
        fade: {
            initial: { opacity: 0 },
            enter: { opacity: 1 },
            exit: { opacity: 0 }
        },
        slide: {
            initial: { opacity: 0, y: 20 },
            enter: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 }
        },
        scale: {
            initial: { opacity: 0, scale: 0.95 },
            enter: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.95 }
        },
        lift: {
            initial: { opacity: 0, y: 24, scale: 0.96 },
            enter: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: -24, scale: 0.96 }
        }
    }

    const transition = prefersReduced
        ? { duration: 0.001 }
        : { 
            duration: 0.4,
            ease: easeOutQuart,
            delay
        }

    return (
        <AnimatePresence mode="wait">
            {loading ? (
                <Card {...cardProps} className={className}>
                    <CardContent>
                        <Skeleton variant="rectangular" width="100%" height={200} />
                    </CardContent>
                </Card>
            ) : (
                <motion.div
                    key="content"
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    variants={variants[variant]}
                    transition={transition}
                >
                    <Card {...cardProps} className={className}>
                        {children}
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

interface AnimatedChartProps extends PropsWithChildren {
    loading?: boolean
    height?: number | string
    delay?: number
}

export function AnimatedChart({ children, loading = false, height = 300, delay = 0.2 }: AnimatedChartProps) {
    const prefersReduced = useReducedMotion()

    const transition = prefersReduced
        ? { duration: 0.001 }
        : { 
            duration: 0.6,
            ease: easeOutCirc,
            delay
        }

    return (
        <Box sx={{ position: 'relative', height }}>
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ position: 'absolute', inset: 0 }}
                    >
                        <Skeleton 
                            variant="rectangular" 
                            width="100%" 
                            height="100%"
                            sx={{ borderRadius: 1 }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="chart"
                        initial={{ 
                            opacity: 0, 
                            scale: 0.95,
                            y: 20
                        }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1,
                            y: 0
                        }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.95,
                            y: -20
                        }}
                        transition={transition}
                        style={{ position: 'absolute', inset: 0 }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    )
}

interface AnimatedTableProps extends PropsWithChildren {
    loading?: boolean
    rows?: number
    delay?: number
}

export function AnimatedTable({ children, loading = false, rows = 5, delay = 0.1 }: AnimatedTableProps) {
    const prefersReduced = useReducedMotion()

    const transition = prefersReduced
        ? { duration: 0.001 }
        : { 
            duration: 0.4,
            ease: easeOutQuart,
            delay
        }

    return (
        <AnimatePresence mode="wait">
            {loading ? (
                <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Box sx={{ width: '100%' }}>
                        {/* Header skeleton */}
                        <Skeleton 
                            variant="rectangular" 
                            width="100%" 
                            height={48} 
                            sx={{ mb: 1, borderRadius: '4px 4px 0 0' }}
                        />
                        {/* Row skeletons */}
                        {Array.from({ length: rows }).map((_, i) => (
                            <Skeleton 
                                key={i}
                                variant="rectangular" 
                                width="100%" 
                                height={40} 
                                sx={{ 
                                    mb: 1, 
                                    opacity: 1 - (i * 0.1),
                                    borderRadius: i === rows - 1 ? '0 0 4px 4px' : 0
                                }}
                            />
                        ))}
                    </Box>
                </motion.div>
            ) : (
                <motion.div
                    key="table"
                    initial={{ 
                        opacity: 0, 
                        y: 16,
                        scale: 0.98
                    }}
                    animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: 1
                    }}
                    exit={{ 
                        opacity: 0, 
                        y: -16,
                        scale: 0.98
                    }}
                    transition={transition}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

interface FadeInWhenVisibleProps extends PropsWithChildren {
    delay?: number
    threshold?: number
    className?: string
}

export function FadeInWhenVisible({ 
    children, 
    delay = 0, 
    threshold = 0.1,
    className 
}: FadeInWhenVisibleProps) {
    const prefersReduced = useReducedMotion()

    if (prefersReduced) {
        return <div className={className}>{children}</div>
    }

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: threshold }}
            transition={{
                duration: 0.5,
                delay,
                ease: easeOutQuart
            }}
        >
            {children}
        </motion.div>
    )
}

// Animated number counter
interface AnimatedNumberProps {
    value: number
    duration?: number
    prefix?: string
    suffix?: string
    decimals?: number
}

export function AnimatedNumber({ 
    value, 
    duration = 0.8, 
    prefix = '', 
    suffix = '',
    decimals = 1
}: AnimatedNumberProps) {
    const prefersReduced = useReducedMotion()

    if (prefersReduced) {
        return <span>{prefix}{value.toFixed(decimals)}{suffix}</span>
    }

    return (
        <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: easeOutQuart }}
        >
            <motion.span
                initial={{ rotateX: -90 }}
                animate={{ rotateX: 0 }}
                transition={{ duration, ease: easeOutCirc }}
                style={{ display: 'inline-block' }}
            >
                {prefix}{value.toFixed(decimals)}{suffix}
            </motion.span>
        </motion.span>
    )
}

// Loading dots animation
export function LoadingDots({ color = 'primary', size = 'small' }: { 
    color?: 'primary' | 'secondary' | 'success' | 'error'
    size?: 'small' | 'medium' | 'large'
}) {
    const sizes = {
        small: 4,
        medium: 6,
        large: 8
    }

    const dotSize = sizes[size]

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: '50%',
                        backgroundColor: `var(--mui-palette-${color}-main)`
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: 'easeInOut'
                    }}
                />
            ))}
        </Box>
    )
}