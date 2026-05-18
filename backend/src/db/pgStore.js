import pg from 'pg'
import { config } from '../config.js'
import { logger } from '../logger.js'
import { loadSeedData } from './seed.js'

const pool = new pg.Pool({ connectionString: config.databaseUrl })
let hasLegacySessionIdColumn = false

function getLegacySessionId(userId) {
  return `user:${userId}`
}

export async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      email           TEXT NOT NULL UNIQUE,
      password_hash   TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parkings (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      address       TEXT NOT NULL,
      total_spots   INTEGER NOT NULL,
      free_spots    INTEGER NOT NULL,
      price_per_hour INTEGER NOT NULL,
      description   TEXT
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id),
      parking_id    TEXT NOT NULL REFERENCES parkings(id),
      parking_name  TEXT NOT NULL,
      address       TEXT NOT NULL,
      spot_number   TEXT NOT NULL,
      date          TEXT NOT NULL,
      time_from     TEXT NOT NULL,
      time_to       TEXT NOT NULL,
      total_price   INTEGER NOT NULL
    )
  `)
  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS user_id TEXT
  `)
  const legacySessionIdColumnResult = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'session_id'
    ) AS exists
  `)
  hasLegacySessionIdColumn = legacySessionIdColumnResult.rows[0].exists
  const demoUser = {
    id: 'seed-user',
    name: 'Демо пользователь',
    email: 'demo@example.com',
    passwordHash: 'seed-demo-hash',
  }
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [demoUser.id, demoUser.name, demoUser.email, demoUser.passwordHash],
  )
  await pool.query(`
    UPDATE bookings
    SET user_id = 'seed-user'
    WHERE user_id IS NULL
  `)
  if (hasLegacySessionIdColumn) {
    await pool.query(`
      UPDATE bookings
      SET session_id = 'seed-session'
      WHERE session_id IS NULL
    `)
    await pool.query(`
      ALTER TABLE bookings
      ALTER COLUMN session_id DROP NOT NULL
    `)
  }
  await pool.query(`
    ALTER TABLE bookings
    ALTER COLUMN user_id SET NOT NULL
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS bookings_user_id_idx
    ON bookings(user_id)
  `)

  const { rows } = await pool.query('SELECT count(*)::int AS cnt FROM parkings')
  if (rows[0].cnt === 0) {
    const seed = loadSeedData()
    for (const p of seed.parkings) {
      await pool.query(
        `INSERT INTO parkings (id, name, address, total_spots, free_spots, price_per_hour, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [p.id, p.name, p.address, p.totalSpots, p.freeSpots, p.pricePerHour, p.description],
      )
    }
    for (const b of seed.bookings) {
      if (hasLegacySessionIdColumn) {
        await pool.query(
          `INSERT INTO bookings (id, session_id, user_id, parking_id, parking_name, address, spot_number, date, time_from, time_to, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [b.id, 'seed-session', 'seed-user', b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice],
        )
      } else {
        await pool.query(
          `INSERT INTO bookings (id, user_id, parking_id, parking_name, address, spot_number, date, time_from, time_to, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [b.id, 'seed-user', b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice],
        )
      }
    }
    logger.info('db.seed_loaded', { dbType: 'postgres' })
  }
  logger.info('db.ready', { dbType: 'postgres' })
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

export async function decrementParkingFreeSpots(parkingId) {
  await pool.query(
    'UPDATE parkings SET free_spots = free_spots - 1 WHERE id = $1 AND free_spots > 0',
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
