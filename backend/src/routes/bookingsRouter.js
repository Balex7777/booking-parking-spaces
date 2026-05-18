import { Router } from 'express'
import * as bookingService from '../services/bookingService.js'

const router = Router()

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Для этого действия нужно войти в аккаунт' })
    return
  }
  next()
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const bookings = await bookingService.getAllBookings(req.session.userId)
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { parkingId, spotNumber, date, timeFrom, timeTo } = req.body
    if (!parkingId || !spotNumber || !date || !timeFrom || !timeTo) {
      return res.status(400).json({ error: 'Не указаны обязательные поля: parkingId, spotNumber, date, timeFrom, timeTo' })
    }
    const booking = await bookingService.createBooking({
      userId: req.session.userId,
      parkingId,
      spotNumber,
      date,
      timeFrom,
      timeTo,
    })
    res.status(201).json(booking)
  } catch (err) {
    const code = err.message.includes('не найдена') || err.message.includes('свободных') || err.message.includes('Минимальное')
      ? 400
      : 500
    res.status(code).json({ error: err.message })
  }
})

export default router
