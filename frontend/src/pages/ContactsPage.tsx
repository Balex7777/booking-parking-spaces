import classes from './Page.module.css'

function ContactsPage() {
  return (
    <section className={classes.section}>
      <h2 className={classes.title}>Контакты и поддержка</h2>
      <div className={classes.detail}>
        <p><strong>Телефон поддержки:</strong> 8 (800) 123-45-67</p>
        <p><strong>Режим работы:</strong> Круглосуточно, без выходных</p>
        <p><strong>Email:</strong> support@parking-online.ru</p>
        <p>По вопросам бронирования, отмены и оплаты — звоните или пишите. Поможем с выбором парковки.</p>
      </div>
    </section>
  )
}

export default ContactsPage
