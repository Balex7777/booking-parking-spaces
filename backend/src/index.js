import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { config } from './config.js'
import { initDb } from './db/store.js'
import parkingsRouter from './routes/parkingsRouter.js'
import bookingsRouter from './routes/bookingsRouter.js'

const app = express()

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())

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

async function start() {
  await initDb()
  app.listen(config.port, config.host, () => {
    console.log(`[${config.nodeEnv}] [${config.dbType}] Сервер: http://${config.host}:${config.port}`)
  })
}

start().catch((err) => {
  console.error('Не удалось запустить приложение:', err)
  process.exit(1)
})
