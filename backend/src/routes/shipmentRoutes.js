import { Router } from 'express'
import {
  createShipment,
  getShipmentById,
  getShipments,
  trackShipmentByTrackingId,
  updateShipment,
} from '../controllers/shipmentController.js'

const router = Router()

router.get('/shipments', getShipments)
router.get('/shipments/:id', getShipmentById)
router.get('/track/:trackingId', trackShipmentByTrackingId)
router.post('/shipments', createShipment)
router.put('/shipments/:id', updateShipment)

export default router
