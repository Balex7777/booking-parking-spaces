import classes from './Page.module.css'

function RatesPage() {
  return (
    <section className={classes.section}>
      <h2 className={classes.title}>Тарифы и условия</h2>
      <div className={classes.detail}>
        <p><strong>Оплата:</strong> почасовая. Минимальное время брони — 1 час. Округление в большую сторону.</p>
        <p><strong>Отмена:</strong> бесплатная отмена не менее чем за 2 часа до начала брони. При поздней отмене удерживается 50% от суммы.</p>
        <p><strong>Оплата на месте:</strong> после бронирования оплата производится при въезде на парковку или через приложение.</p>
        <p>Подробности уточняйте в описании каждой парковки и по телефону поддержки 8 (800) 123-45-67.</p>
      </div>
    </section>
  )
}

export default RatesPage
