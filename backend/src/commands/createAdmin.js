import { connectDb, closeDb, createUser, getUserByEmail } from '../db/store.js'
import { hashPassword } from '../services/authService.js'
import { logger } from '../logger.js'

function parseArgs(argv) {
  const options = {}
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue
    const [key, value] = arg.slice(2).split('=')
    options[key] = value ?? true
  }
  return options
}

export async function runCreateAdmin(argv) {
  const options = parseArgs(argv)
  const email = options.email
  const password = options.password ?? process.env.ADMIN_PASSWORD
  const name = options.name ?? 'Администратор'

  if (!email) {
    throw new Error('Укажите --email=admin@example.com')
  }
  if (!password) {
    throw new Error('Укажите --password=... или переменную ADMIN_PASSWORD')
  }

  await connectDb()

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await getUserByEmail(normalizedEmail)
  if (existing) {
    throw new Error(`Пользователь ${normalizedEmail} уже существует`)
  }

  const user = {
    id: `admin-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
  }

  await createUser(user)
  await closeDb()

  logger.info('admin.created', { email: normalizedEmail, userId: user.id })
  console.log(`Администратор создан: ${normalizedEmail}`)
}
