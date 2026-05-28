export const id = '002_legacy_session_compat'
export const description = 'Демо-пользователь, backfill user_id, legacy session_id'

const demoUser = {
  id: 'seed-user',
  name: 'Демо пользователь',
  email: 'demo@example.com',
  passwordHash: 'seed-demo-hash',
}

export async function up({ query, exec, dbType }) {
  if (dbType === 'postgres') {
    await query(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [demoUser.id, demoUser.name, demoUser.email, demoUser.passwordHash],
    )

    const { rows } = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'session_id'
      ) AS exists
    `)
    if (rows[0].exists) {
      await query(`UPDATE bookings SET session_id = 'seed-session' WHERE session_id IS NULL`)
      await query(`ALTER TABLE bookings ALTER COLUMN session_id DROP NOT NULL`)
    }
    await query(`UPDATE bookings SET user_id = $1 WHERE user_id IS NULL`, [demoUser.id])
    await query(`ALTER TABLE bookings ALTER COLUMN user_id SET NOT NULL`)
    return
  }

  exec(
    `INSERT OR IGNORE INTO users (id, name, email, password_hash)
     VALUES (?, ?, ?, ?)`,
    { params: [demoUser.id, demoUser.name, demoUser.email, demoUser.passwordHash] },
  )

  const columns = exec('PRAGMA table_info(bookings)', { all: true })
  if (columns.some((column) => column.name === 'session_id')) {
    exec(`UPDATE bookings SET session_id = 'seed-session' WHERE session_id IS NULL`)
  }
  exec(`UPDATE bookings SET user_id = ? WHERE user_id IS NULL`, { params: [demoUser.id] })
}
