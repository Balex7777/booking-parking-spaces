import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getParkingById } from '../api/parkingsApi'
import { createBooking } from '../api/bookingsApi'
import { calculatePrice } from '../services/bookingService'
import type { ParkingLot } from '../types/parking'
import classes from './Page.module.css'
import bookingClasses from './ParkingDetailPage.module.css'

function ParkingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [parking, setParking] = useState<ParkingLot | null>(null)
  const [loading, setLoading] = useState(true)
  const [spotNumber, setSpotNumber] = useState('')
  const [date, setDate] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    getParkingById(id)
      .then((p) => setParking(p ?? null))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parking || !spotNumber || !date || !timeFrom || !timeTo) return
    setSubmitError(null)
    try {
      await createBooking({
        parkingId: parking.id,
        spotNumber,
        date,
        timeFrom,
        timeTo,
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ошибка бронирования')
    }
  }

  if (loading) return <section className={classes.section}><p>Загрузка...</p></section>
  if (!parking) {
    return (
      <section className={classes.section}>
        <div className={classes.detail}>
          <h2>Парковка не найдена</h2>
          <p>Проверьте адрес или вернитесь к <Link to="/parkings">списку парковок</Link>.</p>
        </div>
      </section>
    )
  }

  const totalPrice = calculatePrice(parking.pricePerHour, timeFrom, timeTo)

  return (
    <section className={classes.section}>
      <div className={classes.detail}>
        <h2>{parking.name}</h2>
        <p><strong>Адрес:</strong> {parking.address}</p>
        <p>Свободно мест: {parking.freeSpots} из {parking.totalSpots}. Цена: {parking.pricePerHour} ₽/час.</p>
        <p>{parking.description}</p>
        <p><Link to="/parkings">← Все парковки</Link></p>
      </div>

      <div className={bookingClasses.booking}>
        <h3 className={bookingClasses.bookingTitle}>Забронировать место</h3>
        {submitted ? (
          <p className={bookingClasses.success}>
            Бронирование отправлено. Номер места: {spotNumber}, дата: {date}, время: {timeFrom}–{timeTo}.
            Сумма: {totalPrice} ₽.
          </p>
        ) : (
          <form className={bookingClasses.form} onSubmit={handleSubmit}>
            {submitError && <p className={bookingClasses.error}>{submitError}</p>}
            <label>
              Номер места
              <input
                type="text"
                value={spotNumber}
                onChange={(e) => setSpotNumber(e.target.value)}
                placeholder="Напр. A-12"
                required
              />
            </label>
            <label>
              Дата
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label>
              Время с
              <input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                required
              />
            </label>
            <label>
              Время до
              <input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                required
              />
            </label>
            {timeFrom && timeTo && (
              <p className={bookingClasses.total}>Итого: {totalPrice} ₽</p>
            )}
            <button type="submit" className={bookingClasses.button}>Забронировать</button>
          </form>
        )}
      </div>
    </section>
  )
}

export default ParkingDetailPage
