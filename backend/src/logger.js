import { config } from './config.js'

const LEVEL_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function shouldLog(level) {
  const configuredLevel = LEVEL_PRIORITY[config.logLevel] ?? LEVEL_PRIORITY.info
  return (LEVEL_PRIORITY[level] ?? LEVEL_PRIORITY.info) >= configuredLevel
}

function write(level, event, fields = {}) {
  if (!shouldLog(level)) return

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: config.serviceName,
    event,
    ...fields,
  }

  const line = `${JSON.stringify(entry)}\n`
  const stream = level === 'error' ? process.stderr : process.stdout
  stream.write(line)
}

export function createLogger(baseFields = {}) {
  return {
    child(fields = {}) {
      return createLogger({ ...baseFields, ...fields })
    },
    debug(event, fields = {}) {
      write('debug', event, { ...baseFields, ...fields })
    },
    info(event, fields = {}) {
      write('info', event, { ...baseFields, ...fields })
    },
    warn(event, fields = {}) {
      write('warn', event, { ...baseFields, ...fields })
    },
    error(event, fields = {}) {
      write('error', event, { ...baseFields, ...fields })
    },
  }
}

export const logger = createLogger()
