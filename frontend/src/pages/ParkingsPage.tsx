import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ParkingCard from '../components/ParkingCard/ParkingCard'
import { getParkings } from '../api/parkingsApi'
import type { ParkingLot } from '../types/parking'
import classes from './Page.module.css'

function ParkingsPage() {
  const [parkings, setParkings] = useState<ParkingLot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getParkings()
      .then(setParkings)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <section className={classes.section}><p>Загрузка...</p></section>
  if (error) return <section className={classes.section}><p className={classes.error}>{error}</p></section>

  return (
    <section className={classes.section}>
      <h2 className={classes.title}>Парковки</h2>
      <p className={classes.subtitle}>Выберите парковку и перейдите к бронированию места.</p>
      <div className={classes.grid}>
        {parkings.map((parking) => (
          <Link key={parking.id} to={`/parkings/${parking.id}`} className={classes.cardLink}>
            <ParkingCard parking={parking} />
          </Link>
        ))}
      </div>
    </section>
  )
}

export default ParkingsPage
