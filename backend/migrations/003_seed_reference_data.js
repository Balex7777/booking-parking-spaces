import { loadSeedData } from '../src/db/seed.js'

export const id = '003_seed_reference_data'
export const description = 'Справочные парковки и демо-бронирование'

export async function up({ query, exec, dbType, hasLegacySessionIdColumn }) {
  if (dbType === 'postgres') {
    const { rows } = await query('SELECT count(*)::int AS cnt FROM parkings')
    if (rows[0].cnt > 0) return

    const seed = loadSeedData()
    for (const p of seed.parkings) {
      await query(
        `INSERT INTO parkings (id, name, address, total_spots, free_spots, price_per_hour, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [p.id, p.name, p.address, p.totalSpots, p.freeSpots, p.pricePerHour, p.description],
      )
    }
    for (const b of seed.bookings) {
      if (hasLegacySessionIdColumn) {
        await query(
          `INSERT INTO bookings (id, session_id, user_id, parking_id, parking_name, address, spot_number, date, time_from, time_to, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (id) DO NOTHING`,
          [b.id, 'seed-session', 'seed-user', b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice],
        )
      } else {
        await query(
          `INSERT INTO bookings (id, user_id, parking_id, parking_name, address, spot_number, date, time_from, time_to, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (id) DO NOTHING`,
          [b.id, 'seed-user', b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice],
        )
      }
    }
    return
  }

  const cnt = exec('SELECT count(*) AS cnt FROM parkings', { get: true }).cnt
  if (cnt > 0) return

  const seed = loadSeedData()
  for (const p of seed.parkings) {
    exec(
      `INSERT OR IGNORE INTO parkings (id,name,address,total_spots,free_spots,price_per_hour,description)
       VALUES (?,?,?,?,?,?,?)`,
      { params: [p.id, p.name, p.address, p.totalSpots, p.freeSpots, p.pricePerHour, p.description] },
    )
  }
  for (const b of seed.bookings) {
    if (hasLegacySessionIdColumn) {
      exec(
        `INSERT OR IGNORE INTO bookings (id,session_id,user_id,parking_id,parking_name,address,spot_number,date,time_from,time_to,total_price)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        { params: [b.id, 'seed-session', 'seed-user', b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice] },
      )
    } else {
      exec(
        `INSERT OR IGNORE INTO bookings (id,user_id,parking_id,parking_name,address,spot_number,date,time_from,time_to,total_price)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        { params: [b.id, 'seed-user', b.parkingId, b.parkingName, b.address, b.spotNumber, b.date, b.timeFrom, b.timeTo, b.totalPrice] },
      )
    }
  }
}
