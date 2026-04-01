import Card from '../Card/Card'
import classes from './InfoCards.module.css'

function InfoCards() {
  return (
    <div className={classes.cards}>
      <Card
        title="Найти парковку"
        description="Список парковок с адресами, свободными местами и ценами. Выберите и забронируйте."
        linkText="Смотреть парковки"
        to="/parkings"
      />
      <Card
        title="Мои бронирования"
        description="Просмотр и отмена ваших забронированных парковочных мест."
        linkText="Мои брони"
        to="/my-bookings"
      />
      <Card
        title="Тарифы и условия"
        description="Стоимость почасовой оплаты, правила бронирования и отмены."
        linkText="Подробнее"
        to="/rates"
      />
    </div>
  )
}

export default InfoCards
