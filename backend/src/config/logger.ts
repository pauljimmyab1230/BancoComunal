type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL as LogLevel] ?? LOG_LEVELS.info

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  return args.length > 0 ? `${prefix} ${message}` : `${prefix} ${message}`
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message), ...args)
    }
  },
  info(message: string, ...args: unknown[]) {
    if (currentLevel <= LOG_LEVELS.info) {
      console.info(formatMessage('info', message), ...args)
    }
  },
  warn(message: string, ...args: unknown[]) {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message), ...args)
    }
  },
  error(message: string, ...args: unknown[]) {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(formatMessage('error', message), ...args)
    }
  },
}
