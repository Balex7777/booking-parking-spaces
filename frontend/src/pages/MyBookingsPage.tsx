import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteBooking, getBookings, updateBooking } from '../api/bookingsApi'
import type { Booking } from '../types/parking'
import classes from './Page.module.css'
import bookingClasses from './MyBookingsPage.module.css'

type EditState = {
  spotNumber: string
  date: string
  timeFrom: string
  timeTo: string
}

function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditState | null>(null)
  const [submitState, setSubmitState] = useState<{ id: string; mode: 'save' | 'delete' } | null>(null)

  const loadBookings = async () => {
    const data = await getBookings()
    setBookings(data)
  }

  useEffect(() => {
    loadBookings()
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  const startEditing = (booking: Booking) => {
    setEditingId(booking.id)
    setForm({
      spotNumber: booking.spotNumber,
      date: booking.date,
      timeFrom: booking.timeFrom,
      timeTo: booking.timeTo,
    })
    setActionError(null)
  }

  const stopEditing = () => {
    setEditingId(null)
    setForm(null)
  }

  const handleSave = async (booking: Booking) => {
    if (!form) return
    setSubmitState({ id: booking.id, mode: 'save' })
    setActionError(null)
    try {
      const updated = await updateBooking(booking.id, form)
      setBookings((current) => current.map((item) => (item.id === booking.id ? updated : item)))
      stopEditing()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Ошибка обновления бронирования')
    } finally {
      setSubmitState(null)
    }
  }

  const handleDelete = async (booking: Booking) => {
    setSubmitState({ id: booking.id, mode: 'delete' })
    setActionError(null)
    try {
      await deleteBooking(booking.id)
      setBookings((current) => current.filter((item) => item.id !== booking.id))
      if (editingId === booking.id) {
        stopEditing()
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Ошибка удаления бронирования')
    } finally {
      setSubmitState(null)
    }
  }

  if (loading) return <section className={classes.section}><p>Загрузка...</p></section>
  if (error) return <section className={classes.section}><p className={classes.error}>{error}</p></section>

  return (
    <section className={classes.section}>
      <h2 className={classes.title}>Мои бронирования</h2>
      <p className={bookingClasses.lead}>Здесь можно просматривать, редактировать и отменять созданные бронирования.</p>
      {actionError && <p className={classes.error}>{actionError}</p>}
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
              {editingId === b.id && form ? (
                <div className={bookingClasses.form}>
                  <label>
                    Номер места
                    <input
                      type="text"
                      value={form.spotNumber}
                      onChange={(event) => setForm({ ...form, spotNumber: event.target.value })}
                    />
                  </label>
                  <label>
                    Дата
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) => setForm({ ...form, date: event.target.value })}
                    />
                  </label>
                  <label>
                    Время с
                    <input
                      type="time"
                      value={form.timeFrom}
                      onChange={(event) => setForm({ ...form, timeFrom: event.target.value })}
                    />
                  </label>
                  <label>
                    Время до
                    <input
                      type="time"
                      value={form.timeTo}
                      onChange={(event) => setForm({ ...form, timeTo: event.target.value })}
                    />
                  </label>
                  <p className={bookingClasses.total}>Стоимость будет пересчитана сервером после сохранения изменений.</p>
                  <div className={bookingClasses.actions}>
                    <button
                      type="button"
                      className={bookingClasses.primaryButton}
                      onClick={() => void handleSave(b)}
                      disabled={submitState?.id === b.id}
                    >
                      {submitState?.id === b.id && submitState.mode === 'save' ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      className={bookingClasses.secondaryButton}
                      onClick={stopEditing}
                      disabled={submitState?.id === b.id}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p>Место: <strong>{b.spotNumber}</strong></p>
                  <p>Дата: {b.date}, {b.timeFrom} – {b.timeTo}</p>
                  <p>Сумма: {b.totalPrice} ₽</p>
                  <div className={bookingClasses.actions}>
                    <button
                      type="button"
                      className={bookingClasses.primaryButton}
                      onClick={() => startEditing(b)}
                      disabled={submitState?.id === b.id}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      className={bookingClasses.dangerButton}
                      onClick={() => void handleDelete(b)}
                      disabled={submitState?.id === b.id}
                    >
                      {submitState?.id === b.id && submitState.mode === 'delete' ? 'Отменяем...' : 'Удалить'}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MyBookingsPage
