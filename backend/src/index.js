import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import parkingsRouter from './routes/parkingsRouter.js'
import bookingsRouter from './routes/bookingsRouter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'

app.use(cors())
app.use(express.json())

app.use('/api/parkings', parkingsRouter)
app.use('/api/bookings', bookingsRouter)

const publicDir = process.env.STATIC_DIR ?? path.join(__dirname, '../public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { index: false }))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next()
      return
    }
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.listen(PORT, HOST, () => {
  console.log(`Сервер: http://${HOST}:${PORT}`)
})
