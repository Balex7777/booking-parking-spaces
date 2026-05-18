import 'dotenv/config'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  serviceName:     process.env.SERVICE_NAME ?? 'parking-backend',
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
  redisUrl:        process.env.REDIS_URL ?? '',
  sessionSecret:   process.env.SESSION_SECRET ?? 'local-dev-session-secret',
  sessionName:     process.env.SESSION_NAME ?? 'parking.sid',
  sessionTtlMs:    Number(process.env.SESSION_TTL_MS ?? 1000 * 60 * 60 * 24),
  sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
  trustProxy:      process.env.TRUST_PROXY === 'true',
  releaseVersion:  process.env.RELEASE_VERSION ?? 'dev',
  releaseEnv:      process.env.RELEASE_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  instanceId:      process.env.INSTANCE_ID ?? `${os.hostname()}-${process.pid}`,
}
