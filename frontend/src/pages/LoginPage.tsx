import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import classes from './Page.module.css'
import authClasses from './AuthPage.module.css'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/my-bookings'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={classes.section}>
      <div className={authClasses.shell}>
        <aside className={authClasses.promo}>
          <div>
            <h2>Вход в личный кабинет</h2>
            <p>Авторизуйтесь, чтобы бронирования были привязаны к вашему аккаунту и не зависели от того, на какой экземпляр приложения попадёт запрос.</p>
          </div>
          <ul className={authClasses.promoList}>
            <li>История и активные бронирования доступны только вам.</li>
            <li>Сессия живёт централизованно и работает на любом инстансе сервиса.</li>
            <li>После входа можно сразу переходить к выбору парковочного места.</li>
          </ul>
        </aside>

        <div className={authClasses.card}>
          <h1>Войти</h1>
          <p className={authClasses.lead}>Используйте email и пароль от созданного аккаунта.</p>

          <form className={authClasses.form} onSubmit={handleSubmit}>
            {error && <p className={authClasses.error}>{error}</p>}
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Пароль
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <button className={authClasses.submit} type="submit" disabled={submitting}>
              {submitting ? 'Входим...' : 'Войти'}
            </button>
          </form>

          <p className={authClasses.switch}>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
