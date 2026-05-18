import { Router } from 'express'
import { config } from '../config.js'
import * as authService from '../services/authService.js'

const router = Router()

router.get('/me', async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.session.userId)
    res.json({ user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Необходимо указать имя, email и пароль' })
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать не менее 6 символов' })
    }

    const user = await authService.register({ name, email, password })
    req.session.userId = user.id
    res.status(201).json({ user })
  } catch (err) {
    const status = err.message.includes('уже существует') ? 409 : 400
    res.status(status).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Необходимо указать email и пароль' })
    }

    const user = await authService.login({ email, password })
    req.session.userId = user.id
    res.json({ user })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
})

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Не удалось завершить сессию' })
      return
    }
    res.clearCookie(config.sessionName)
    res.status(204).end()
  })
})

export default router
