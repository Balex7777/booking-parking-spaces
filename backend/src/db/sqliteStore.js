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

  const cnt = db.prepare('SELECT count(*) AS cnt FROM parkings').get().cnt
  if (cnt === 0) {
    const seed = loadSeedData()
    const insP = db.prepare(
      `INSERT INTO parkings (id,name,address,total_spots,free_spots,price_per_hour,description)
       VALUES (?,?,?,?,?,?,?)`,
    )
    const insB = db.prepare(
      `INSERT INTO bookings (id,parking_id,parking_name,address,spot_number,date,time_from,time_to,total_price)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    const tx = db.transaction(() => {
      for (const p of seed.parkings) insP.run(p.id, p.name, p.address, p.totalSpots, p.freeSpots, p.pricePerHour, p.description)
      for (const b of seed.bookings) insB.run(b.id, b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice)
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
    id: r.id, parkingId: r.parking_id, parkingName: r.parking_name,
    address: r.address, spotNumber: r.spot_number, date: r.date,
    timeFrom: r.time_from, timeTo: r.time_to, totalPrice: r.total_price,
  }
}

export async function getParkings() {
  return db.prepare('SELECT * FROM parkings ORDER BY id').all().map(rowToParking)
}

export async function getParkingById(id) {
  const row = db.prepare('SELECT * FROM parkings WHERE id = ?').get(id)
  return row ? rowToParking(row) : null
}

export async function getBookings() {
  return db.prepare('SELECT * FROM bookings ORDER BY id').all().map(rowToBooking)
}

export async function addBooking(booking) {
  db.prepare(
    `INSERT INTO bookings (id,parking_id,parking_name,address,spot_number,date,time_from,time_to,total_price)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(booking.id, booking.parkingId, booking.parkingName, booking.address,
    booking.spotNumber, booking.date, booking.timeFrom, booking.timeTo, booking.totalPrice)
  return booking
}

export async function decrementParkingFreeSpots(parkingId) {
  db.prepare('UPDATE parkings SET free_spots = free_spots - 1 WHERE id = ? AND free_spots > 0').run(parkingId)
}
