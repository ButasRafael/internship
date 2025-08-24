import { MotionConfig, motion, useReducedMotion, cubicBezier} from 'framer-motion'
import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
    variant?: 'fade' | 'shared' | 'slide' | 'scale'
    duration?: number
    delay?: number
}>

// Enhanced easing curves for smoother animations
const easeInOut = cubicBezier(0.4, 0.0, 0.2, 1)
const easeOutQuart = cubicBezier(0.25, 1, 0.5, 1)
const easeOutBack = cubicBezier(0.34, 1.56, 0.64, 1)

const variants = {
    fade: {
        initial: { 
            opacity: 0, 
            scale: 0.96, 
            filter: 'blur(4px)',
            y: 8
        },
        enter: { 
            opacity: 1, 
            scale: 1, 
            filter: 'blur(0px)',
            y: 0
        },
        exit: { 
            opacity: 0, 
            scale: 0.96, 
            filter: 'blur(4px)',
            y: -8
        },
    },
    shared: {
        initial: { 
            opacity: 0, 
            x: 24, 
            scale: 0.98,
            filter: 'blur(2px)'
        },
        enter: { 
            opacity: 1, 
            x: 0, 
            scale: 1,
            filter: 'blur(0px)'
        },
        exit: { 
            opacity: 0, 
            x: -24, 
            scale: 0.98,
            filter: 'blur(2px)'
        },
    },
    slide: {
        initial: { 
            opacity: 0, 
            y: 32,
            scale: 0.98
        },
        enter: { 
            opacity: 1, 
            y: 0,
            scale: 1
        },
        exit: { 
            opacity: 0, 
            y: -32,
            scale: 0.98
        },
    },
    scale: {
        initial: { 
            opacity: 0, 
            scale: 0.9,
            rotate: -1
        },
        enter: { 
            opacity: 1, 
            scale: 1,
            rotate: 0
        },
        exit: { 
            opacity: 0, 
            scale: 0.9,
            rotate: 1
        },
    }
}

export default function EnhancedPageTransition({ 
    children, 
    variant = 'fade', 
    duration = 0.4,
    delay = 0 
}: Props) {
    const prefersReduced = useReducedMotion()
    const selectedVariants = variants[variant]

    const transition = prefersReduced
        ? { duration: 0.001 }
        : { 
            duration,
            ease: variant === 'scale' ? easeOutBack : easeOutQuart,
            delay
        }

    return (
        <MotionConfig reducedMotion="user">
            <motion.div
                initial="initial"
                animate="enter"
                exit="exit"
                variants={selectedVariants}
                transition={transition}
                style={{ 
                    willChange: 'opacity, transform, filter',
                    minHeight: '100%',
                    width: '100%'
                }}
            >
                {children}
            </motion.div>
        </MotionConfig>
    )
}

// Staggered children animation for lists/grids
export function StaggeredContainer({ 
    children, 
    className,
    stagger = 0.05,
    delay = 0.1 
}: PropsWithChildren<{ 
    className?: string, 
    stagger?: number,
    delay?: number 
}>) {
    const prefersReduced = useReducedMotion()
    
    if (prefersReduced) {
        return <div className={className}>{children}</div>
    }

    return (
        <motion.div
            className={className}
            initial="initial"
            animate="enter"
            variants={{
                initial: {},
                enter: {
                    transition: {
                        staggerChildren: stagger,
                        delayChildren: delay
                    }
                }
            }}
        >
            {children}
        </motion.div>
    )
}

// Individual item in staggered container
export function StaggeredItem({ 
    children, 
    className,
    variant = 'fade'
}: PropsWithChildren<{ 
    className?: string,
    variant?: 'fade' | 'slide' | 'scale'
}>) {
    const prefersReduced = useReducedMotion()
    
    const itemVariants = {
        fade: {
            initial: { opacity: 0, y: 12, filter: 'blur(2px)' },
            enter: { opacity: 1, y: 0, filter: 'blur(0px)' }
        },
        slide: {
            initial: { opacity: 0, x: -20, scale: 0.96 },
            enter: { opacity: 1, x: 0, scale: 1 }
        },
        scale: {
            initial: { opacity: 0, scale: 0.8 },
            enter: { opacity: 1, scale: 1 }
        }
    }

    if (prefersReduced) {
        return <div className={className}>{children}</div>
    }

    return (
        <motion.div
            className={className}
            variants={itemVariants[variant]}
            transition={{
                duration: 0.3,
                ease: easeInOut
            }}
        >
            {children}
        </motion.div>
    )
}