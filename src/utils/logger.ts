import pinoPkg from 'pino'
import type { Logger } from 'pino'

const pinoFn: typeof pinoPkg.default = (pinoPkg as any).default ?? (pinoPkg as any)

export const logger: Logger = pinoFn({
    transport: { target: 'pino-pretty' }
})
