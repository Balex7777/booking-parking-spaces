import type { Booking, CreateBookingPayload, UpdateBookingPayload } from '../types/parking'
import { api } from './client'

export async function getBookings(): Promise<Booking[]> {
  return api.get<Booking[]>('/bookings')
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  return api.post<Booking>('/bookings', payload)
}

export async function updateBooking(id: string, payload: UpdateBookingPayload): Promise<Booking> {
  return api.put<Booking>(`/bookings/${id}`, payload)
}

export async function deleteBooking(id: string): Promise<void> {
  await api.delete<null>(`/bookings/${id}`)
}
