import { config } from '../config.js'

let adapter

export async function initDb() {
  if (config.dbType === 'postgres') {
    adapter = await import('./pgStore.js')
  } else {
    adapter = await import('./sqliteStore.js')
  }
  await adapter.init()
}

export async function getParkings()                  { return adapter.getParkings() }
export async function getParkingById(id)             { return adapter.getParkingById(id) }
export async function getBookings()                  { return adapter.getBookings() }
export async function addBooking(booking)            { return adapter.addBooking(booking) }
export async function decrementParkingFreeSpots(id)  { return adapter.decrementParkingFreeSpots(id) }
