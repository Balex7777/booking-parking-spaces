import express from 'express'
import cors from 'cors'
import parkingsRouter from './routes/parkingsRouter.js'
import bookingsRouter from './routes/bookingsRouter.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/api/parkings', parkingsRouter)
app.use('/api/bookings', bookingsRouter)

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`)
})
