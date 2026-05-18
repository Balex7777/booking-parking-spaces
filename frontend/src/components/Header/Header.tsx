import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import Navigation from '../Navigation/Navigation'
import classes from './Header.module.css'

function Header() {
  const { user, logout } = useAuth()

  return (
    <header className={classes.header}>
      <div className={classes.logoWrap}>
        <div className={classes.logoIcon} aria-hidden>P</div>
        <h1 className={classes.title}>Парковка Онлайн</h1>
      </div>
      <div className={classes.actions}>
        <Navigation />
        <div className={classes.account}>
          {user ? (
            <>
              <span className={classes.userBadge}>{user.name}</span>
              <button type="button" className={classes.authButton} onClick={() => void logout()}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={classes.authLink}>Войти</Link>
              <Link to="/register" className={classes.authButton}>Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
