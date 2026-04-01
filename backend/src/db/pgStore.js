import pg from 'pg'
import { config } from '../config.js'
import { loadSeedData } from './seed.js'

const pool = new pg.Pool({ connectionString: config.databaseUrl })

export async function init() {
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
      await pool.query(
        `INSERT INTO bookings (id, parking_id, parking_name, address, spot_number, date, time_from, time_to, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [b.id, b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice],
      )
    }
    console.log('[pg] Начальные данные загружены')
  }
  console.log('[pg] База готова')
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
    id: r.id, parkingId: r.parking_id, parkingName: r.parking_name,
    address: r.address, spotNumber: r.spot_number, date: r.date,
    timeFrom: r.time_from, timeTo: r.time_to, totalPrice: r.total_price,
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

export async function getBookings() {
  const { rows } = await pool.query('SELECT * FROM bookings ORDER BY id')
  return rows.map(rowToBooking)
}

export async function addBooking(booking) {
  await pool.query(
    `INSERT INTO bookings (id, parking_id, parking_name, address, spot_number, date, time_from, time_to, total_price)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [booking.id, booking.parkingId, booking.parkingName, booking.address,
     booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice],
  )
  return booking
}

export async function decrementParkingFreeSpots(parkingId) {
  await pool.query(
    'UPDATE parkings SET free_spots = free_spots - 1 WHERE id = $1 AND free_spots > 0',
    [parkingId],
  )
}
