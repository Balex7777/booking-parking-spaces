import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import session from 'express-session'
import fs from 'fs'
import path from 'path'
import { RedisStore } from 'connect-redis'
import { createClient } from 'redis'
import { config } from './config.js'
import { initDb } from './db/store.js'
import { logger } from './logger.js'
import authRouter from './routes/authRouter.js'
import parkingsRouter from './routes/parkingsRouter.js'
import bookingsRouter from './routes/bookingsRouter.js'

const app = express()
let redisClient

if (config.trustProxy) {
  app.set('trust proxy', 1)
}

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())

async function createSessionMiddleware() {
  if (!config.redisUrl) {
    logger.warn('session.store.memory_fallback', {
      message: 'REDIS_URL не задан, используется MemoryStore только для локальной разработки',
    })
    return session({
      name: config.sessionName,
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: config.sessionTtlMs,
      },
    })
  }

  redisClient = createClient({ url: config.redisUrl })
  redisClient.on('error', (err) => {
    logger.error('redis.client_error', {
      message: err.message,
      stack: err.stack,
    })
  })
  await redisClient.connect()
  logger.info('redis.connected', { redisUrl: config.redisUrl })

  return session({
    store: new RedisStore({ client: redisClient, prefix: 'parking:sess:' }),
    name: config.sessionName,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: config.sessionTtlMs,
      secure: config.sessionCookieSecure,
    },
  })
}

app.use((req, res, next) => {
  const requestId = req.get('X-Request-ID')?.trim() || crypto.randomUUID()
  const requestLogger = logger.child({ requestId })
  const startedAt = process.hrtime.bigint()

  req.requestId = requestId
  req.log = requestLogger
  res.setHeader('X-Request-ID', requestId)

  requestLogger.info('http.request.started', {
    method: req.method,
    path: req.originalUrl,
    remoteAddress: req.ip,
  })

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    requestLogger.info('http.request.completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userId: req.session?.userId ?? null,
    })
  })

  next()
})

app.use((req, res, next) => {
  res.setHeader('X-Instance-Id', config.instanceId)
  res.setHeader('X-Release-Version', config.releaseVersion)
  res.setHeader('X-Release-Environment', config.releaseEnv)
  next()
})

function registerRoutes() {
  app.get('/api/meta', (req, res) => {
    res.json({
      instanceId: config.instanceId,
      releaseVersion: config.releaseVersion,
      environment: config.releaseEnv,
      sessionId: req.sessionID ?? null,
      userId: req.session.userId ?? null,
    })
  })
  app.use('/api/auth', authRouter)
  app.use('/api/parkings', parkingsRouter)
  app.use('/api/bookings', bookingsRouter)

  if (fs.existsSync(config.staticDir)) {
    app.use(express.static(config.staticDir, { index: false }))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next()
        return
      }
      res.sendFile(path.join(config.staticDir, 'index.html'), (err) => {
        if (err) next(err)
      })
    })
  }
}

async function start() {
  const sessionMiddleware = await createSessionMiddleware()
  app.use(sessionMiddleware)
  app.use((req, _res, next) => {
    if (!req.session.clientSince) {
      req.session.clientSince = new Date().toISOString()
    }
    next()
  })
  registerRoutes()
  await initDb()
  app.listen(config.port, config.host, () => {
    logger.info('server.started', {
      environment: config.releaseEnv,
      releaseVersion: config.releaseVersion,
      instanceId: config.instanceId,
      dbType: config.dbType,
      host: config.host,
      port: config.port,
    })
  })
}

start().catch((err) => {
  logger.error('server.start_failed', {
    message: err.message,
    stack: err.stack,
  })
  process.exit(1)
})
