import Navigation from '../Navigation/Navigation'
import classes from './Header.module.css'

function Header() {
  return (
    <header className={classes.header}>
      <div className={classes.logoWrap}>
        <div className={classes.logoIcon} aria-hidden>P</div>
        <h1 className={classes.title}>Парковка Онлайн</h1>
      </div>
      <Navigation />
    </header>
  )
}

export default Header
