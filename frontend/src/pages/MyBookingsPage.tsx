import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBookings } from '../api/bookingsApi'
import type { Booking } from '../types/parking'
import classes from './Page.module.css'
import bookingClasses from './MyBookingsPage.module.css'

function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <section className={classes.section}><p>Загрузка...</p></section>
  if (error) return <section className={classes.section}><p className={classes.error}>{error}</p></section>

  return (
    <section className={classes.section}>
      <h2 className={classes.title}>Мои бронирования</h2>
      {bookings.length === 0 ? (
        <div className={classes.detail}>
          <p>У вас пока нет активных бронирований. Перейдите в <Link to="/parkings">поиск парковок</Link>, чтобы забронировать место.</p>
        </div>
      ) : (
        <ul className={bookingClasses.list}>
          {bookings.map((b) => (
            <li key={b.id} className={bookingClasses.item}>
              <h3>{b.parkingName}</h3>
              <p>{b.address}</p>
              <p>Место: <strong>{b.spotNumber}</strong></p>
              <p>Дата: {b.date}, {b.timeFrom} – {b.timeTo}</p>
              <p>Сумма: {b.totalPrice} ₽</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MyBookingsPage
