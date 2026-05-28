import { runServer } from './commands/server.js'
import { logger } from './logger.js'

runServer().catch((err) => {
  logger.error('server.start_failed', {
    message: err.message,
    stack: err.stack,
  })
  process.exit(1)
})
