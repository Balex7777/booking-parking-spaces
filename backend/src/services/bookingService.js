import * as db from '../db/store.js'
import { config } from '../config.js'

const MIN_BOOKING_HOURS = config.minBookingHours

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function calculateTotalHours(timeFrom, timeTo) {
  const from = parseTime(timeFrom)
  const to = parseTime(timeTo)
  if (to <= from) return 0
  return (to - from) / 60
}

export function calculatePrice(pricePerHour, timeFrom, timeTo) {
  const hours = calculateTotalHours(timeFrom, timeTo)
  const billableHours = Math.max(MIN_BOOKING_HOURS, Math.ceil(hours))
  return billableHours * pricePerHour
}

export async function getAllBookings() {
  return db.getBookings()
}

export async function createBooking({ parkingId, spotNumber, date, timeFrom, timeTo }) {
  const parking = await db.getParkingById(parkingId)
  if (!parking) {
    throw new Error('Парковка не найдена')
  }
  if (parking.freeSpots <= 0) {
    throw new Error('Нет свободных мест')
  }
  const hours = calculateTotalHours(timeFrom, timeTo)
  if (hours < MIN_BOOKING_HOURS) {
    throw new Error(`Минимальное время бронирования — ${MIN_BOOKING_HOURS} ч`)
  }
  const totalPrice = calculatePrice(parking.pricePerHour, timeFrom, timeTo)
  const id = 'b' + Date.now()
  const booking = {
    id,
    parkingId,
    parkingName: parking.name,
    address: parking.address,
    spotNumber: spotNumber.trim(),
    date,
    timeFrom,
    timeTo,
    totalPrice,
  }
  await db.addBooking(booking)
  await db.decrementParkingFreeSpots(parkingId)
  return booking
}
