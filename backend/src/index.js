import express from 'express'
import cors from 'cors'
import session from 'express-session'
import fs from 'fs'
import path from 'path'
import { RedisStore } from 'connect-redis'
import { createClient } from 'redis'
import { config } from './config.js'
import { initDb } from './db/store.js'
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
    console.warn('[session] REDIS_URL не задан, используется MemoryStore только для локальной разработки')
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
    console.error('[redis] Ошибка:', err)
  })
  await redisClient.connect()

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
    })
  })
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
    console.log(
      `[${config.releaseEnv}] release=${config.releaseVersion} instance=${config.instanceId} db=${config.dbType} server=http://${config.host}:${config.port}`,
    )
  })
}

start().catch((err) => {
  console.error('Не удалось запустить приложение:', err)
  process.exit(1)
})
