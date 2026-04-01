import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  port:            Number(process.env.PORT ?? 3001),
  host:            process.env.HOST ?? '0.0.0.0',
  nodeEnv:         process.env.NODE_ENV ?? 'development',
  corsOrigin:      process.env.CORS_ORIGIN ?? '*',
  staticDir:       process.env.STATIC_DIR ?? path.join(__dirname, '../public'),
  dataDir:         process.env.DATA_DIR ?? path.join(__dirname, '../data'),
  minBookingHours: Number(process.env.MIN_BOOKING_HOURS ?? 1),
  logLevel:        process.env.LOG_LEVEL ?? 'info',

  databaseUrl:     process.env.DATABASE_URL ?? '',
  dbType:          process.env.DB_TYPE ?? (process.env.DATABASE_URL ? 'postgres' : 'sqlite'),
}
