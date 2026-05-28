import crypto from 'crypto'
import * as db from '../db/store.js'

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false

  const derivedKey = crypto.scryptSync(password, salt, 64)
  const storedKeyBuffer = Buffer.from(key, 'hex')
  return (
    storedKeyBuffer.length === derivedKey.length &&
    crypto.timingSafeEqual(storedKeyBuffer, derivedKey)
  )
}

export async function register({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email)
  const existingUser = await db.getUserByEmail(normalizedEmail)
  if (existingUser) {
    throw new Error('Пользователь с таким email уже существует')
  }

  const user = {
    id: `u${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
  }

  await db.createUser(user)
  return sanitizeUser(user)
}

export async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email)
  const user = await db.getUserByEmail(normalizedEmail)
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Неверный email или пароль')
  }
  return sanitizeUser(user)
}

export async function getCurrentUser(userId) {
  if (!userId) return null
  return db.getUserById(userId)
}
