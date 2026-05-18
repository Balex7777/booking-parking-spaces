import Database from 'better-sqlite3'
import path from 'path'
import { config } from '../config.js'
import { loadSeedData } from './seed.js'

const dbPath = path.join(config.dataDir, 'parking.db')
let db

export async function init() {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      email          TEXT NOT NULL UNIQUE,
      password_hash  TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS parkings (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      address        TEXT NOT NULL,
      total_spots    INTEGER NOT NULL,
      free_spots     INTEGER NOT NULL,
      price_per_hour INTEGER NOT NULL,
      description    TEXT
    )
  `)
  db.exec(`
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
  const bookingColumns = db.prepare("PRAGMA table_info(bookings)").all()
  if (!bookingColumns.some((column) => column.name === 'user_id')) {
    db.exec("ALTER TABLE bookings ADD COLUMN user_id TEXT")
    db.exec("UPDATE bookings SET user_id = 'seed-user' WHERE user_id IS NULL")
  }
  db.exec("CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id)")
  db.prepare(
    `INSERT OR IGNORE INTO users (id, name, email, password_hash)
     VALUES (?, ?, ?, ?)`,
  ).run('seed-user', 'Демо пользователь', 'demo@example.com', 'seed-demo-hash')

  const cnt = db.prepare('SELECT count(*) AS cnt FROM parkings').get().cnt
  if (cnt === 0) {
    const seed = loadSeedData()
    const insP = db.prepare(
      `INSERT INTO parkings (id,name,address,total_spots,free_spots,price_per_hour,description)
       VALUES (?,?,?,?,?,?,?)`,
    )
    const insB = db.prepare(
      `INSERT INTO bookings (id,user_id,parking_id,parking_name,address,spot_number,date,time_from,time_to,total_price)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    )
    const tx = db.transaction(() => {
      for (const p of seed.parkings) insP.run(p.id, p.name, p.address, p.totalSpots, p.freeSpots, p.pricePerHour, p.description)
      for (const b of seed.bookings) insB.run(b.id, 'seed-user', b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice)
    })
    tx()
    console.log('[sqlite] Начальные данные загружены')
  }
  console.log(`[sqlite] База: ${dbPath}`)
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

export async function addBooking(booking) {
  db.prepare(
    `INSERT INTO bookings (id,user_id,parking_id,parking_name,address,spot_number,date,time_from,time_to,total_price)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(booking.id, booking.userId, booking.parkingId, booking.parkingName, booking.address,
    booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice)
  return booking
}

export async function decrementParkingFreeSpots(parkingId) {
  db.prepare('UPDATE parkings SET free_spots = free_spots - 1 WHERE id = ? AND free_spots > 0').run(parkingId)
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
