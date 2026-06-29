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

router.get('/:id', async (req, res) => {
  try {
    const bookings = await bookingService.getAllBookings(req.session.userId)
    const booking = bookings.find((item) => item.id === req.params.id)
    if (!booking) {
      req.log?.warn('booking.not_found', {
        userId: req.session.userId,
        bookingId: req.params.id,
      })
      return res.status(404).json({ error: 'Бронирование не найдено' })
    }
    req.log?.info('booking.fetched', {
      userId: req.session.userId,
      bookingId: booking.id,
    })
    res.json(booking)
  } catch (err) {
    req.log?.error('booking.fetch_failed', {
      userId: req.session.userId,
      bookingId: req.params.id,
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
    const code = err.message.includes('не найдена')
      || err.message.includes('свободных')
      || err.message.includes('Минимальное')
      || err.message.includes('Некоррект')
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

router.put('/:id', async (req, res) => {
  try {
    const { spotNumber, date, timeFrom, timeTo } = req.body
    const booking = await bookingService.updateExistingBooking({
      bookingId: req.params.id,
      userId: req.session.userId,
      spotNumber,
      date,
      timeFrom,
      timeTo,
    })
    req.log?.info('booking.updated', {
      userId: req.session.userId,
      bookingId: booking.id,
    })
    res.json(booking)
  } catch (err) {
    const code = err.message.includes('не найдено')
      ? 404
      : err.message.includes('Некоррект') || err.message.includes('Минимальное')
        ? 400
      : 500
    req.log?.error('booking.update_failed', {
      userId: req.session.userId,
      bookingId: req.params.id,
      message: err.message,
      stack: err.stack,
      statusCode: code,
    })
    res.status(code).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await bookingService.deleteExistingBooking({
      bookingId: req.params.id,
      userId: req.session.userId,
    })
    req.log?.info('booking.deleted', {
      userId: req.session.userId,
      bookingId: req.params.id,
    })
    res.status(204).end()
  } catch (err) {
    const code = err.message.includes('не найдено') ? 404 : 500
    req.log?.error('booking.delete_failed', {
      userId: req.session.userId,
      bookingId: req.params.id,
      message: err.message,
      stack: err.stack,
      statusCode: code,
    })
    res.status(code).json({ error: err.message })
  }
})

export default router
