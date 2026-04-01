import type { ParkingLot } from '../../types/parking'
import classes from './ParkingCard.module.css'

type ParkingCardProps = {
  parking: ParkingLot
}

function ParkingCard({ parking }: ParkingCardProps) {
  return (
    <article className={classes.card}>
      <h3>{parking.name}</h3>
      <p className={classes.address}>{parking.address}</p>
      <div className={classes.meta}>
        <span className={classes.spots}>Свободно мест: {parking.freeSpots} из {parking.totalSpots}</span>
        <span className={classes.price}>{parking.pricePerHour} ₽/час</span>
      </div>
      <p className={classes.desc}>{parking.description}</p>
    </article>
  )
}

export default ParkingCard
