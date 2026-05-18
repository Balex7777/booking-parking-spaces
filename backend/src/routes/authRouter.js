import { Router } from 'express'
import { config } from '../config.js'
import * as authService from '../services/authService.js'

const router = Router()

router.get('/me', async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.session.userId)
    req.log?.info('auth.me', {
      userId: req.session.userId ?? null,
      authenticated: Boolean(user),
    })
    res.json({ user })
  } catch (err) {
    req.log?.error('auth.me_failed', {
      userId: req.session.userId ?? null,
      message: err.message,
      stack: err.stack,
    })
    res.status(500).json({ error: err.message })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      req.log?.warn('auth.register_validation_failed', { email: email ?? null })
      return res.status(400).json({ error: 'Необходимо указать имя, email и пароль' })
    }
    if (String(password).length < 6) {
      req.log?.warn('auth.register_validation_failed', { email })
      return res.status(400).json({ error: 'Пароль должен содержать не менее 6 символов' })
    }

    const user = await authService.register({ name, email, password })
    req.session.userId = user.id
    req.log?.info('auth.registered', {
      userId: user.id,
      email: user.email,
    })
    res.status(201).json({ user })
  } catch (err) {
    const status = err.message.includes('уже существует') ? 409 : 400
    req.log?.error('auth.register_failed', {
      email: req.body?.email ?? null,
      message: err.message,
      stack: err.stack,
      statusCode: status,
    })
    res.status(status).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      req.log?.warn('auth.login_validation_failed', { email: email ?? null })
      return res.status(400).json({ error: 'Необходимо указать email и пароль' })
    }

    const user = await authService.login({ email, password })
    req.session.userId = user.id
    req.log?.info('auth.logged_in', {
      userId: user.id,
      email: user.email,
    })
    res.json({ user })
  } catch (err) {
    req.log?.error('auth.login_failed', {
      email: req.body?.email ?? null,
      message: err.message,
      stack: err.stack,
    })
    res.status(401).json({ error: err.message })
  }
})

router.post('/logout', (req, res) => {
  const userId = req.session?.userId ?? null
  req.session.destroy((err) => {
    if (err) {
      req.log?.error('auth.logout_failed', {
        userId,
        message: err.message,
      })
      res.status(500).json({ error: 'Не удалось завершить сессию' })
      return
    }
    req.log?.info('auth.logged_out', {
      userId,
    })
    res.clearCookie(config.sessionName)
    res.status(204).end()
  })
})

export default router
