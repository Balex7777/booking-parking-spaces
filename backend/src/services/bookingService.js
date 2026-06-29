import * as db from '../db/store.js'
import { config } from '../config.js'

const MIN_BOOKING_HOURS = config.minBookingHours

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Некорректное поле ${fieldName}`)
  }
}

function assertDateString(value) {
  assertNonEmptyString(value, 'date')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new Error('Некорректный формат даты')
  }
}

function parseTime(timeStr) {
  assertNonEmptyString(timeStr, 'time')
  if (!/^\d{2}:\d{2}$/.test(timeStr.trim())) {
    throw new Error('Некорректный формат времени')
  }

  const [h, m] = timeStr.split(':').map(Number)
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error('Некорректный формат времени')
  }
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

function validateBookingInput({ parkingId, spotNumber, date, timeFrom, timeTo }) {
  assertNonEmptyString(parkingId, 'parkingId')
  assertNonEmptyString(spotNumber, 'spotNumber')
  assertDateString(date)

  const hours = calculateTotalHours(timeFrom, timeTo)
  if (hours < MIN_BOOKING_HOURS) {
    throw new Error(`Минимальное время бронирования — ${MIN_BOOKING_HOURS} ч`)
  }

  return {
    parkingId: parkingId.trim(),
    spotNumber: spotNumber.trim(),
    date: date.trim(),
    timeFrom: timeFrom.trim(),
    timeTo: timeTo.trim(),
  }
}

export async function getAllBookings(userId) {
  return db.getBookings(userId)
}

export async function createBooking({ parkingId, spotNumber, date, timeFrom, timeTo, userId }) {
  const normalized = validateBookingInput({ parkingId, spotNumber, date, timeFrom, timeTo })
  const parking = await db.getParkingById(normalized.parkingId)
  if (!parking) {
    throw new Error('Парковка не найдена')
  }
  if (parking.freeSpots <= 0) {
    throw new Error('Нет свободных мест')
  }
  const totalPrice = calculatePrice(parking.pricePerHour, normalized.timeFrom, normalized.timeTo)
  const id = 'b' + Date.now()
  const booking = {
    id,
    userId,
    parkingId: normalized.parkingId,
    parkingName: parking.name,
    address: parking.address,
    spotNumber: normalized.spotNumber,
    date: normalized.date,
    timeFrom: normalized.timeFrom,
    timeTo: normalized.timeTo,
    totalPrice,
  }
  await db.addBooking(booking)
  await db.decrementParkingFreeSpots(normalized.parkingId)
  return booking
}

export async function updateExistingBooking({ bookingId, spotNumber, date, timeFrom, timeTo, userId }) {
  assertNonEmptyString(bookingId, 'bookingId')

  const existingBooking = await db.getBookingById(bookingId.trim())
  if (!existingBooking || existingBooking.userId !== userId) {
    throw new Error('Бронирование не найдено')
  }

  const normalized = validateBookingInput({
    parkingId: existingBooking.parkingId,
    spotNumber,
    date,
    timeFrom,
    timeTo,
  })
  const parking = await db.getParkingById(existingBooking.parkingId)
  if (!parking) {
    throw new Error('Парковка не найдена')
  }

  const updatedBooking = {
    ...existingBooking,
    spotNumber: normalized.spotNumber,
    date: normalized.date,
    timeFrom: normalized.timeFrom,
    timeTo: normalized.timeTo,
    totalPrice: calculatePrice(parking.pricePerHour, normalized.timeFrom, normalized.timeTo),
  }

  await db.updateBooking(updatedBooking)
  return updatedBooking
}

export async function deleteExistingBooking({ bookingId, userId }) {
  assertNonEmptyString(bookingId, 'bookingId')

  const existingBooking = await db.getBookingById(bookingId.trim())
  if (!existingBooking || existingBooking.userId !== userId) {
    throw new Error('Бронирование не найдено')
  }

  await db.deleteBooking(existingBooking.id)
  await db.incrementParkingFreeSpots(existingBooking.parkingId)
}
