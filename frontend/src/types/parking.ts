export type ParkingLot = {
  id: string
  name: string
  address: string
  totalSpots: number
  freeSpots: number
  pricePerHour: number
  description: string
}

export type Booking = {
  id: string
  userId: string
  parkingId: string
  parkingName: string
  address: string
  spotNumber: string
  date: string
  timeFrom: string
  timeTo: string
  totalPrice: number
}

export type AuthUser = {
  id: string
  name: string
  email: string
}

export type CreateBookingPayload = {
  parkingId: string
  spotNumber: string
  date: string
  timeFrom: string
  timeTo: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
}
