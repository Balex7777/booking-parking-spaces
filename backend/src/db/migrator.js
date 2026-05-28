import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import Database from 'better-sqlite3'
import { config } from '../config.js'
import { logger } from '../logger.js'

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../migrations')

async function loadMigrations() {
  const files = fs.readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.js'))
    .sort()

  const migrations = []
  for (const file of files) {
    const mod = await import(path.join(migrationsDir, file))
    migrations.push(mod)
  }
  return migrations
}

async function detectLegacySessionIdColumnPg(pool) {
  const { rows } = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'session_id'
    ) AS exists
  `)
  return rows[0].exists
}

function detectLegacySessionIdColumnSqlite(db) {
  return db.prepare('PRAGMA table_info(bookings)').all().some((column) => column.name === 'session_id')
}

async function runPgMigrations() {
  const pool = new pg.Pool({ connectionString: config.databaseUrl })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const { rows: appliedRows } = await pool.query('SELECT id FROM schema_migrations')
    const applied = new Set(appliedRows.map((row) => row.id))
    const migrations = await loadMigrations()

    const query = (text, params = []) => pool.query(text, params)
    let hasLegacySessionIdColumn = await detectLegacySessionIdColumnPg(pool)

    for (const migration of migrations) {
      if (applied.has(migration.id)) {
        logger.info('migration.skipped', { id: migration.id })
        continue
      }

      logger.info('migration.started', { id: migration.id, description: migration.description })
      await migration.up({
        dbType: 'postgres',
        query,
        hasLegacySessionIdColumn,
      })
      hasLegacySessionIdColumn = await detectLegacySessionIdColumnPg(pool)
      await pool.query(
        'INSERT INTO schema_migrations (id, description) VALUES ($1, $2)',
        [migration.id, migration.description],
      )
      logger.info('migration.applied', { id: migration.id })
    }
  } finally {
    await pool.end()
  }
}

async function runSqliteMigrations() {
  const dbPath = path.join(config.dataDir, 'parking.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const applied = new Set(
      db.prepare('SELECT id FROM schema_migrations').all().map((row) => row.id),
    )
    const migrations = await loadMigrations()

    const exec = (sql, options = {}) => {
      if (options.get) return db.prepare(sql).get(...(options.params ?? []))
      if (options.all) return db.prepare(sql).all(...(options.params ?? []))
      if (options.params) return db.prepare(sql).run(...options.params)
      return db.exec(sql)
    }

    let hasLegacySessionIdColumn = detectLegacySessionIdColumnSqlite(db)

    for (const migration of migrations) {
      if (applied.has(migration.id)) {
        logger.info('migration.skipped', { id: migration.id })
        continue
      }

      logger.info('migration.started', { id: migration.id, description: migration.description })
      await migration.up({
        dbType: 'sqlite',
        exec,
        hasLegacySessionIdColumn,
      })
      db.prepare('INSERT INTO schema_migrations (id, description) VALUES (?, ?)').run(
        migration.id,
        migration.description,
      )
      hasLegacySessionIdColumn = detectLegacySessionIdColumnSqlite(db)
      logger.info('migration.applied', { id: migration.id })
    }
  } finally {
    db.close()
  }
}

export async function runMigrations() {
  if (config.dbType === 'postgres') {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL обязателен для migrate (postgres)')
    }
    await runPgMigrations()
    return
  }

  await runSqliteMigrations()
}
