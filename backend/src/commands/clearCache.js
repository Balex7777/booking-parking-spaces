import { createClient } from 'redis'
import { config } from '../config.js'
import { logger } from '../logger.js'

const SESSION_PREFIX = 'parking:sess:'

export async function runClearCache() {
  if (!config.redisUrl) {
    throw new Error('REDIS_URL не задан — очистка кэша сессий недоступна')
  }

  const client = createClient({ url: config.redisUrl })
  await client.connect()

  let cursor = 0
  let deleted = 0

  do {
    const reply = await client.scan(cursor, { MATCH: `${SESSION_PREFIX}*`, COUNT: 100 })
    cursor = Number(reply.cursor)
    if (reply.keys.length > 0) {
      deleted += await client.del(reply.keys)
    }
  } while (cursor !== 0)

  await client.quit()
  logger.info('cache.cleared', { prefix: SESSION_PREFIX, deleted })
  console.log(`Удалено ключей сессий: ${deleted}`)
}
