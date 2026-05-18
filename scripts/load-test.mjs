import { URL } from 'node:url'

const rawBaseUrl = process.argv[2] ?? 'http://localhost:8080'
const requests = Number(process.argv[3] ?? 60)
const concurrency = Number(process.argv[4] ?? 12)

const metaUrl = new URL('/api/meta', rawBaseUrl).toString()
const counts = new Map()
let completed = 0

async function hit(index) {
  const response = await fetch(metaUrl)
  if (!response.ok) {
    throw new Error(`Request ${index} failed with status ${response.status}`)
  }

  const instanceId = response.headers.get('x-instance-id') ?? 'unknown'
  counts.set(instanceId, (counts.get(instanceId) ?? 0) + 1)
  completed += 1
}

async function worker(offset) {
  for (let i = offset; i < requests; i += concurrency) {
    await hit(i)
  }
}

await Promise.all(
  Array.from({ length: Math.min(concurrency, requests) }, (_, index) => worker(index)),
)

console.log(`Load test completed: ${completed}/${requests}`)
for (const [instanceId, count] of [...counts.entries()].sort()) {
  console.log(`${instanceId}: ${count}`)
}
