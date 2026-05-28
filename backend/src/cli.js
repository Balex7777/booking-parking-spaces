#!/usr/bin/env node
import { logger } from './logger.js'

const HELP = `parking-app — административные команды и HTTP-сервер

Использование:
  node src/cli.js <команда> [опции]

Команды:
  server                 Запуск HTTP-сервера (по умолчанию)
  migrate                Применить миграции БД и выйти
  create-admin           Создать администратора
  clear-cache            Очистить сессии в Redis

Примеры:
  node src/cli.js server
  node src/cli.js migrate
  node src/cli.js create-admin --email=admin@example.com --password=secret
  node src/cli.js clear-cache
`

function parseCommand(argv) {
  const args = [...argv]
  let command = 'server'

  if (args[0] && !args[0].startsWith('--')) {
    command = args.shift()
  }

  return { command, args }
}

async function main() {
  const { command, args } = parseCommand(process.argv.slice(2))

  switch (command) {
    case 'server':
    case 'start': {
      const { runServer } = await import('./commands/server.js')
      await runServer()
      break
    }
    case 'migrate': {
      const { runMigrate } = await import('./commands/migrate.js')
      await runMigrate()
      break
    }
    case 'create-admin': {
      const { runCreateAdmin } = await import('./commands/createAdmin.js')
      await runCreateAdmin(args)
      break
    }
    case 'clear-cache': {
      const { runClearCache } = await import('./commands/clearCache.js')
      await runClearCache()
      break
    }
    case 'help':
    case '--help':
    case '-h':
      console.log(HELP)
      break
    default:
      console.error(`Неизвестная команда: ${command}\n`)
      console.log(HELP)
      process.exit(1)
  }
}

main().catch((err) => {
  logger.error('cli.failed', { command: process.argv[2], message: err.message, stack: err.stack })
  console.error(err.message)
  process.exit(1)
})
