import { migrateDb } from '../db/store.js'
import { logger } from '../logger.js'

export async function runMigrate() {
  await migrateDb()
  logger.info('migration.completed')
}
