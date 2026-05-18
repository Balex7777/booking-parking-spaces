import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import classes from './Page.module.css'
import authClasses from './AuthPage.module.css'

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await register({ name, email, password })
      navigate('/my-bookings', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={classes.section}>
      <div className={authClasses.shell}>
        <aside className={authClasses.promo}>
          <div>
            <h2>Регистрация в сервисе</h2>
            <p>Создайте аккаунт, чтобы бронирования были персональными, а вход в систему работал одинаково на любом экземпляре приложения.</p>
          </div>
          <ul className={authClasses.promoList}>
            <li>После регистрации сессия создаётся автоматически.</li>
            <li>Бронирования будут храниться за вашим пользователем, а не за случайной вкладкой браузера.</li>
            <li>Доступ к “Моим бронированиям” сразу откроется после создания аккаунта.</li>
          </ul>
        </aside>

        <div className={authClasses.card}>
          <h1>Регистрация</h1>
          <p className={authClasses.lead}>Минимальный пароль — 6 символов. Email должен быть уникальным.</p>

          <form className={authClasses.form} onSubmit={handleSubmit}>
            {error && <p className={authClasses.error}>{error}</p>}
            <label>
              Имя
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Пароль
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
            </label>
            <button className={authClasses.submit} type="submit" disabled={submitting}>
              {submitting ? 'Создаём аккаунт...' : 'Создать аккаунт'}
            </button>
          </form>

          <p className={authClasses.switch}>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
