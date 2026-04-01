import classes from './ServiceCard.module.css'

export type ServiceItem = {
  id: string
  name: string
  description: string
}

type ServiceCardProps = {
  name: string
  description: string
  id: string
}

function ServiceCard({ name, description }: ServiceCardProps) {
  return (
    <article className={classes.card}>
      <h3>{name}</h3>
      <p>{description}</p>
    </article>
  )
}

export default ServiceCard
