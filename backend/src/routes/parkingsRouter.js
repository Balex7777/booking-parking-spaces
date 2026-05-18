import { Router } from 'express'
import * as parkingService from '../services/parkingService.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const parkings = await parkingService.getAllParkings()
    _req.log?.info('parking.listed', { parkingCount: parkings.length })
    res.json(parkings)
  } catch (err) {
    _req.log?.error('parking.list_failed', {
      message: err.message,
      stack: err.stack,
    })
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const parking = await parkingService.getParkingById(req.params.id)
    if (!parking) {
      req.log?.warn('parking.not_found', { parkingId: req.params.id })
      return res.status(404).json({ error: 'Парковка не найдена' })
    }
    req.log?.info('parking.fetched', { parkingId: req.params.id })
    res.json(parking)
  } catch (err) {
    req.log?.error('parking.fetch_failed', {
      parkingId: req.params.id,
      message: err.message,
      stack: err.stack,
    })
    res.status(500).json({ error: err.message })
  }
})

export default router
