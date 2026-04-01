import { NavLink } from 'react-router-dom'
import classes from './Navigation.module.css'

function NavLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${classes.link} ${classes.linkActive}` : classes.link
}

function Navigation() {
  return (
    <ul className={classes.nav}>
      <li><NavLink to="/" className={({ isActive }) => NavLinkClass({ isActive })} end>Главная</NavLink></li>
      <li><NavLink to="/parkings" className={({ isActive }) => NavLinkClass({ isActive })}>Поиск парковок</NavLink></li>
      <li><NavLink to="/my-bookings" className={({ isActive }) => NavLinkClass({ isActive })}>Мои брони</NavLink></li>
      <li><NavLink to="/rates" className={({ isActive }) => NavLinkClass({ isActive })}>Тарифы</NavLink></li>
      <li><NavLink to="/contacts" className={({ isActive }) => NavLinkClass({ isActive })}>Контакты</NavLink></li>
    </ul>
  )
}

export default Navigation
