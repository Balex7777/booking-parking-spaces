import Database from 'better-sqlite3'
import path from 'path'
import { config } from '../config.js'
import { logger } from '../logger.js'

const dbPath = path.join(config.dataDir, 'parking.db')
let db
let hasLegacySessionIdColumn = false

function getLegacySessionId(userId) {
  return `user:${userId}`
}

function refreshLegacySessionIdColumn() {
  hasLegacySessionIdColumn = db
    .prepare('PRAGMA table_info(bookings)')
    .all()
    .some((column) => column.name === 'session_id')
}

export async function connect() {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  refreshLegacySessionIdColumn()
  logger.info('db.connected', { dbType: 'sqlite', dbPath })
}

function rowToParking(r) {
  return {
    id: r.id, name: r.name, address: r.address,
    totalSpots: r.total_spots, freeSpots: r.free_spots,
    pricePerHour: r.price_per_hour, description: r.description,
  }
}

function rowToBooking(r) {
  return {
    id: r.id, userId: r.user_id, parkingId: r.parking_id, parkingName: r.parking_name,
    address: r.address, spotNumber: r.spot_number, date: r.date,
    timeFrom: r.time_from, timeTo: r.time_to, totalPrice: r.total_price,
  }
}

function rowToUser(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    passwordHash: r.password_hash,
  }
}

export async function getParkings() {
  return db.prepare('SELECT * FROM parkings ORDER BY id').all().map(rowToParking)
}

export async function getParkingById(id) {
  const row = db.prepare('SELECT * FROM parkings WHERE id = ?').get(id)
  return row ? rowToParking(row) : null
}

export async function getBookings(userId) {
  return db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY id').all(userId).map(rowToBooking)
}

export async function getBookingById(id) {
  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id)
  return row ? rowToBooking(row) : null
}

export async function addBooking(booking) {
  if (hasLegacySessionIdColumn) {
    db.prepare(
      `INSERT INTO bookings (id,session_id,user_id,parking_id,parking_name,address,spot_number,date,time_from,time_to,total_price)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(booking.id, getLegacySessionId(booking.userId), booking.userId, booking.parkingId, booking.parkingName, booking.address,
      booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice)
  } else {
    db.prepare(
      `INSERT INTO bookings (id,user_id,parking_id,parking_name,address,spot_number,date,time_from,time_to,total_price)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(booking.id, booking.userId, booking.parkingId, booking.parkingName, booking.address,
      booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice)
  }
  return booking
}

export async function updateBooking(booking) {
  db.prepare(
    `UPDATE bookings
     SET spot_number = ?, date = ?, time_from = ?, time_to = ?, total_price = ?
     WHERE id = ?`,
  ).run(booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice, booking.id)
  return booking
}

export async function deleteBooking(id) {
  db.prepare('DELETE FROM bookings WHERE id = ?').run(id)
}

export async function decrementParkingFreeSpots(parkingId) {
  db.prepare('UPDATE parkings SET free_spots = free_spots - 1 WHERE id = ? AND free_spots > 0').run(parkingId)
}

export async function incrementParkingFreeSpots(parkingId) {
  db.prepare(
    'UPDATE parkings SET free_spots = MIN(total_spots, free_spots + 1) WHERE id = ?',
  ).run(parkingId)
}

export async function createUser(user) {
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES (?, ?, ?, ?)`,
  ).run(user.id, user.name, user.email, user.passwordHash)
  return { id: user.id, name: user.name, email: user.email }
}

export async function getUserByEmail(email) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  return row ? rowToUser(row) : null
}

export async function getUserById(id) {
  const row = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id)
  return row ?? null
}

export async function close() {
  if (db) {
    db.close()
    db = undefined
    logger.info('db.closed', { dbType: 'sqlite', dbPath })
  }
}
