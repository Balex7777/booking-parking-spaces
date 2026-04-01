import type { Booking, CreateBookingPayload } from '../types/parking'
import { api } from './client'

export async function getBookings(): Promise<Booking[]> {
  return api.get<Booking[]>('/bookings')
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  return api.post<Booking>('/bookings', payload)
}
