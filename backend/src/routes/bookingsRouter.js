import { Router } from 'express'
import * as bookingService from '../services/bookingService.js'

const router = Router()

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    req.log?.warn('booking.auth_required', { path: req.originalUrl })
    res.status(401).json({ error: 'Для этого действия нужно войти в аккаунт' })
    return
  }
  next()
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const bookings = await bookingService.getAllBookings(req.session.userId)
    req.log?.info('booking.listed', {
      userId: req.session.userId,
      bookingCount: bookings.length,
    })
    res.json(bookings)
  } catch (err) {
    req.log?.error('booking.list_failed', {
      userId: req.session.userId,
      message: err.message,
      stack: err.stack,
    })
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { parkingId, spotNumber, date, timeFrom, timeTo } = req.body
    if (!parkingId || !spotNumber || !date || !timeFrom || !timeTo) {
      req.log?.warn('booking.validation_failed', {
        userId: req.session.userId,
        parkingId: parkingId ?? null,
      })
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
    req.log?.info('booking.created', {
      userId: req.session.userId,
      bookingId: booking.id,
      parkingId: booking.parkingId,
    })
    res.status(201).json(booking)
  } catch (err) {
    const code = err.message.includes('не найдена') || err.message.includes('свободных') || err.message.includes('Минимальное')
      ? 400
      : 500
    req.log?.error('booking.create_failed', {
      userId: req.session.userId,
      message: err.message,
      stack: err.stack,
      statusCode: code,
    })
    res.status(code).json({ error: err.message })
  }
})

export default router
