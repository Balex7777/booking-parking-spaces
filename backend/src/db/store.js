import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '../../data/db.json')

function readDb() {
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    const initialPath = path.join(__dirname, '../../data/initialData.json')
    const raw = fs.readFileSync(initialPath, 'utf-8')
    const data = JSON.parse(raw)
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
    return data
  }
}

function writeDb(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
}

export function getParkings() {
  return readDb().parkings
}

export function getParkingById(id) {
  const parkings = readDb().parkings
  return parkings.find((p) => p.id === id) ?? null
}

export function getBookings() {
  return readDb().bookings
}

export function addBooking(booking) {
  const db = readDb()
  db.bookings.push(booking)
  writeDb(db)
  return booking
}

export function decrementParkingFreeSpots(parkingId) {
  const db = readDb()
  const parking = db.parkings.find((p) => p.id === parkingId)
  if (parking && parking.freeSpots > 0) {
    parking.freeSpots -= 1
    writeDb(db)
  }
}
