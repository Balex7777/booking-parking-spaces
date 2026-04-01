import fs from 'fs'
import path from 'path'
import { config } from '../config.js'

export function loadSeedData() {
  const seedPath = path.join(config.dataDir, 'initialData.json')
  return JSON.parse(fs.readFileSync(seedPath, 'utf-8'))
}
