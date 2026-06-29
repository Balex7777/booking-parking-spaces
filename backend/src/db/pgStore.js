import pg from 'pg'
import { config } from '../config.js'
import { logger } from '../logger.js'

const pool = new pg.Pool({ connectionString: config.databaseUrl })
let hasLegacySessionIdColumn = false

function getLegacySessionId(userId) {
  return `user:${userId}`
}

async function refreshLegacySessionIdColumn() {
  const { rows } = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'session_id'
    ) AS exists
  `)
  hasLegacySessionIdColumn = rows[0].exists
}

export async function connect() {
  await pool.query('SELECT 1')
  await refreshLegacySessionIdColumn()
  logger.info('db.connected', { dbType: 'postgres' })
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
  const { rows } = await pool.query('SELECT * FROM parkings ORDER BY id')
  return rows.map(rowToParking)
}

export async function getParkingById(id) {
  const { rows } = await pool.query('SELECT * FROM parkings WHERE id = $1', [id])
  return rows.length ? rowToParking(rows[0]) : null
}

export async function getBookings(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM bookings WHERE user_id = $1 ORDER BY id',
    [userId],
  )
  return rows.map(rowToBooking)
}

export async function getBookingById(id) {
  const { rows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id])
  return rows.length ? rowToBooking(rows[0]) : null
}

export async function addBooking(booking) {
  if (hasLegacySessionIdColumn) {
    await pool.query(
      `INSERT INTO bookings (id, session_id, user_id, parking_id, parking_name, address, spot_number, date, time_from, time_to, total_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [booking.id, getLegacySessionId(booking.userId), booking.userId, booking.parkingId, booking.parkingName, booking.address,
       booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice],
    )
  } else {
    await pool.query(
      `INSERT INTO bookings (id, user_id, parking_id, parking_name, address, spot_number, date, time_from, time_to, total_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [booking.id, booking.userId, booking.parkingId, booking.parkingName, booking.address,
       booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice],
    )
  }
  return booking
}

export async function updateBooking(booking) {
  await pool.query(
    `UPDATE bookings
     SET spot_number = $2, date = $3, time_from = $4, time_to = $5, total_price = $6
     WHERE id = $1`,
    [booking.id, booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice],
  )
  return booking
}

export async function deleteBooking(id) {
  await pool.query('DELETE FROM bookings WHERE id = $1', [id])
}

export async function decrementParkingFreeSpots(parkingId) {
  await pool.query(
    'UPDATE parkings SET free_spots = free_spots - 1 WHERE id = $1 AND free_spots > 0',
    [parkingId],
  )
}

export async function incrementParkingFreeSpots(parkingId) {
  await pool.query(
    `UPDATE parkings
     SET free_spots = LEAST(total_spots, free_spots + 1)
     WHERE id = $1`,
    [parkingId],
  )
}

export async function createUser(user) {
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES ($1, $2, $3, $4)`,
    [user.id, user.name, user.email, user.passwordHash],
  )
  return { id: user.id, name: user.name, email: user.email }
}

export async function getUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  return rows.length ? rowToUser(rows[0]) : null
}

export async function getUserById(id) {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id])
  return rows.length ? rows[0] : null
}

export async function close() {
  await pool.end()
  logger.info('db.closed', { dbType: 'postgres' })
}
