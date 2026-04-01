import type { ParkingLot } from '../types/parking'
import { api } from './client'

export async function getParkings(): Promise<ParkingLot[]> {
  return api.get<ParkingLot[]>('/parkings')
}

export async function getParkingById(id: string): Promise<ParkingLot | null> {
  try {
    return await api.get<ParkingLot>(`/parkings/${id}`)
  } catch {
    return null
  }
}
