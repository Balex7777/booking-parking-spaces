import * as db from '../db/store.js'

export function getAllParkings() {
  return db.getParkings()
}

export function getParkingById(id) {
  return db.getParkingById(id)
}
