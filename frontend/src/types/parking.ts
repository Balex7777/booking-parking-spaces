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
  parkingId: string
  parkingName: string
  address: string
  spotNumber: string
  date: string
  timeFrom: string
  timeTo: string
  totalPrice: number
}

export type CreateBookingPayload = {
  parkingId: string
  spotNumber: string
  date: string
  timeFrom: string
  timeTo: string
}
