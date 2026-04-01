import { Router } from 'express'
import * as parkingService from '../services/parkingService.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const parkings = await parkingService.getAllParkings()
    res.json(parkings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const parking = await parkingService.getParkingById(req.params.id)
    if (!parking) {
      return res.status(404).json({ error: 'Парковка не найдена' })
    }
    res.json(parking)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
