import { Link } from 'react-router-dom'
import classes from './Card.module.css'

type CardProps = {
  title: string
  description: string
  linkText: string
  href?: string
  to?: string
}

function Card({ title, description, linkText, href = '#', to }: CardProps) {
  const linkContent = `${linkText} →`
  return (
    <article className={classes.card}>
      <h3>{title}</h3>
      <p>{description}</p>
      {to ? (
        <Link to={to} className={classes.link}>{linkContent}</Link>
      ) : (
        <a href={href} className={classes.link}>{linkContent}</a>
      )}
    </article>
  )
}

export default Card
