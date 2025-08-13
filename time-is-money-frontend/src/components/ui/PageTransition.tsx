import { MotionConfig, motion, useReducedMotion, cubicBezier } from 'framer-motion'
import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
    variant?: 'fade' | 'shared'
}>

const fadeThrough = {
    initial: { opacity: 0, scale: 0.985, filter: 'blur(2px)' },
    enter:   { opacity: 1, scale: 1,    filter: 'blur(0px)' },
    exit:    { opacity: 0, scale: 0.985, filter: 'blur(2px)' },
}

const sharedAxisX = {
    initial: { opacity: 0, x: 16,  scale: 0.995 },
    enter:   { opacity: 1, x: 0,   scale: 1 },
    exit:    { opacity: 0, x: -16, scale: 0.995 },
}

const easeOutSoft = cubicBezier(0.22, 0.61, 0.36, 1)

export default function PageTransition({ children, variant = 'fade' }: Props) {
    const prefersReduced = useReducedMotion()
    const variants = variant === 'shared' ? sharedAxisX : fadeThrough

    const transition = prefersReduced
        ? ({ duration: 0.001 } as const)
        : ({ duration: 0.35, ease: easeOutSoft } as const)

    return (
        <MotionConfig reducedMotion="user">
            <motion.div
                initial="initial"
                animate="enter"
                exit="exit"
                variants={variants}
                transition={transition}
                style={{ willChange: 'opacity, transform', minHeight: '100%' }}
            >
                {children}
            </motion.div>
        </MotionConfig>
    )
}
