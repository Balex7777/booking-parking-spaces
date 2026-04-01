import classes from './Hero.module.css'

function Hero() {
  return (
    <section className={classes.hero}>
      <h2>Найдите и забронируйте парковочное место</h2>
      <p>
        Выберите парковку рядом с нужным местом, посмотрите свободные места и оформите бронь онлайн.
        Без очередей и поиска места по городу.
      </p>
    </section>
  )
}

export default Hero
