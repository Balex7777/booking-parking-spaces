import { Router } from 'express'
import * as bookingService from '../services/bookingService.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const bookings = await bookingService.getAllBookings()
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
