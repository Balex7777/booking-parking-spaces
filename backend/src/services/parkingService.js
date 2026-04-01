import * as db from '../db/store.js'

export async function getAllParkings() {
  return db.getParkings()
}

export async function getParkingById(id) {
  return db.getParkingById(id)
}
