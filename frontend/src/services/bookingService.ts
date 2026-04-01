import type { ParkingLot } from '../types/parking'

export function calculateTotalHours(timeFrom: string, timeTo: string): number {
  const parse = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }
  const from = parse(timeFrom)
  const to = parse(timeTo)
  if (to <= from) return 0
  return (to - from) / 60
}

export function calculatePrice(pricePerHour: number, timeFrom: string, timeTo: string): number {
  const hours = calculateTotalHours(timeFrom, timeTo)
  const billableHours = Math.max(1, Math.ceil(hours))
  return billableHours * pricePerHour
}

export function formatBookingSummary(
  parking: ParkingLot,
  spotNumber: string,
  date: string,
  timeFrom: string,
  timeTo: string,
  totalPrice: number
): string {
  return `Парковка: ${parking.name}, место ${spotNumber}, ${date} с ${timeFrom} по ${timeTo}. Сумма: ${totalPrice} ₽.`
}
