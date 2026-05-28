import { config } from '../config.js'
import { runMigrations } from './migrator.js'

let adapter

async function loadAdapter() {
  if (!adapter) {
    adapter = config.dbType === 'postgres'
      ? await import('./pgStore.js')
      : await import('./sqliteStore.js')
  }
  return adapter
}

export async function connectDb() {
  const db = await loadAdapter()
  await db.connect()
}

export async function migrateDb() {
  await runMigrations()
}

/** @deprecated используйте connectDb */
export async function initDb() {
  await connectDb()
}

export async function getParkings()                  { return (await loadAdapter()).getParkings() }
export async function getParkingById(id)             { return (await loadAdapter()).getParkingById(id) }
export async function getBookings(userId)            { return (await loadAdapter()).getBookings(userId) }
export async function addBooking(booking)            { return (await loadAdapter()).addBooking(booking) }
export async function decrementParkingFreeSpots(id)  { return (await loadAdapter()).decrementParkingFreeSpots(id) }
export async function createUser(user)               { return (await loadAdapter()).createUser(user) }
export async function getUserByEmail(email)          { return (await loadAdapter()).getUserByEmail(email) }
export async function getUserById(id)                { return (await loadAdapter()).getUserById(id) }

export async function closeDb() {
  if (adapter?.close) {
    await adapter.close()
  }
}
