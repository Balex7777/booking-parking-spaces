import { Link } from 'react-router-dom'
import classes from './Footer.module.css'

function Footer() {
  return (
    <footer className={classes.footer}>
      <span>📞 8 (800) 123-45-67</span>
      <Link to="/contacts">Контакты и поддержка</Link>
      <span>Поддержка 24/7</span>
    </footer>
  )
}

export default Footer
