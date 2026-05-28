export const id = '001_initial_schema'
export const description = 'Таблицы users, parkings, bookings'

export async function up({ query, exec, dbType }) {
  if (dbType === 'postgres') {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        email           TEXT NOT NULL UNIQUE,
        password_hash   TEXT NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await query(`
      CREATE TABLE IF NOT EXISTS parkings (
        id             TEXT PRIMARY KEY,
        name           TEXT NOT NULL,
        address        TEXT NOT NULL,
        total_spots    INTEGER NOT NULL,
        free_spots     INTEGER NOT NULL,
        price_per_hour INTEGER NOT NULL,
        description    TEXT
      )
    `)
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL REFERENCES users(id),
        parking_id    TEXT NOT NULL REFERENCES parkings(id),
        parking_name  TEXT NOT NULL,
        address       TEXT NOT NULL,
        spot_number   TEXT NOT NULL,
        date          TEXT NOT NULL,
        time_from     TEXT NOT NULL,
        time_to       TEXT NOT NULL,
        total_price   INTEGER NOT NULL
      )
    `)
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id TEXT`)
    await query(`
      CREATE INDEX IF NOT EXISTS bookings_user_id_idx
      ON bookings(user_id)
    `)
    return
  }

  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      email          TEXT NOT NULL UNIQUE,
      password_hash  TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  exec(`
    CREATE TABLE IF NOT EXISTS parkings (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      address        TEXT NOT NULL,
      total_spots    INTEGER NOT NULL,
      free_spots     INTEGER NOT NULL,
      price_per_hour INTEGER NOT NULL,
      description    TEXT
    )
  `)
  exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id),
      parking_id    TEXT NOT NULL REFERENCES parkings(id),
      parking_name  TEXT NOT NULL,
      address       TEXT NOT NULL,
      spot_number   TEXT NOT NULL,
      date          TEXT NOT NULL,
      time_from     TEXT NOT NULL,
      time_to       TEXT NOT NULL,
      total_price   INTEGER NOT NULL
    )
  `)
  const columns = exec(`PRAGMA table_info(bookings)`, { all: true })
  if (!columns.some((column) => column.name === 'user_id')) {
    exec('ALTER TABLE bookings ADD COLUMN user_id TEXT')
  }
  exec('CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id)')
}
