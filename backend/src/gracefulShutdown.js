import { config } from './config.js'

export function createGracefulShutdown({ logger, onCleanup }) {
  let httpServer = null
  let isShuttingDown = false
  let isReady = false
  let activeRequests = 0

  function attachServer(server) {
    httpServer = server
  }

  function trackRequests(req, res, next) {
    if (isShuttingDown) {
      res.set('Connection', 'close')
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Сервер завершает работу',
      })
    }

    activeRequests += 1
    let released = false
    const release = () => {
      if (released) return
      released = true
      activeRequests -= 1
    }
    res.on('finish', release)
    res.on('close', release)
    next()
  }

  function markReady() {
    isReady = true
  }

  function readinessHandler(_req, res) {
    if (!isReady || isShuttingDown) {
      return res.status(503).json({
        status: 'not_ready',
        ready: false,
        shuttingDown: isShuttingDown,
      })
    }
    return res.json({ status: 'ready', ready: true })
  }

  function livenessHandler(_req, res) {
    res.json({
      status: isShuttingDown ? 'shutting_down' : 'alive',
      ready: isReady && !isShuttingDown,
    })
  }

  async function shutdown(signal) {
    if (isShuttingDown) return
    isShuttingDown = true
    isReady = false

    logger.info('server.shutdown_started', {
      signal,
      activeRequests,
      graceMs: config.shutdownGraceMs,
    })

    const shutdownStartedAt = Date.now()
    const deadline = shutdownStartedAt + config.shutdownGraceMs

    while (true) {
      const elapsed = Date.now() - shutdownStartedAt
      const timedOut = Date.now() >= deadline
      const drained = activeRequests === 0 && elapsed >= config.shutdownMinDrainMs

      if (drained || timedOut) break
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    if (activeRequests > 0) {
      logger.warn('server.shutdown_timeout', { activeRequests })
    }

    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(() => {
          logger.info('server.listener_closed', { activeRequests })
          resolve()
        })
      })
    }

    try {
      await onCleanup()
    } catch (err) {
      logger.error('server.shutdown_cleanup_failed', {
        message: err.message,
        stack: err.stack,
      })
    }

    logger.info('server.shutdown_completed', {
      signal,
      activeRequests,
    })

    process.exit(activeRequests > 0 ? 1 : 0)
  }

  const onSignal = (signal) => {
    shutdown(signal).catch((err) => {
      logger.error('server.shutdown_failed', {
        message: err.message,
        stack: err.stack,
      })
      process.exit(1)
    })
  }

  process.on('SIGTERM', () => onSignal('SIGTERM'))
  process.on('SIGINT', () => onSignal('SIGINT'))

  return {
    attachServer,
    trackRequests,
    readinessHandler,
    livenessHandler,
    markReady,
    isShuttingDown: () => isShuttingDown,
  }
}
