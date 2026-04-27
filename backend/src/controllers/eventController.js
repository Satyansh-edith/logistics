import { supabase } from '../config/supabase.js'
import { fetchShipmentEvents } from '../utils/shipmentEvents.js'
import { insertSingleAdaptive, updateSingleAdaptive } from '../utils/supabaseAdaptive.js'

export async function getEventsByShipmentId(req, res) {
  try {
    const { shipmentId } = req.params

    const { data, error } = await fetchShipmentEvents(shipmentId)

    if (error) throw error

    res.json({ success: true, data })
  } catch (err) {
    console.error('Error fetching events:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function addEventToShipment(req, res) {
  try {
    const { shipmentId } = req.params
    const { status, location, latitude, longitude, event_type, description, agent_name } = req.body

    if (!status || !location) {
      return res.status(400).json({ success: false, error: 'Missing status or location' })
    }

    const eventTime = new Date().toISOString()
    const eventPayload = {
      shipment_id: shipmentId,
      status,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      event_type,
      description,
      agent_name,
      occurred_at: eventTime,
      timestamp: eventTime,
    }

    const { data, error } = await insertSingleAdaptive('shipment_events', eventPayload)
    if (error) throw error

    const updatePayload = {
      status,
      current_location: location,
      ...(latitude && { current_lat: parseFloat(latitude) }),
      ...(longitude && { current_lng: parseFloat(longitude) }),
      ...(agent_name && { assigned_agent: agent_name }),
      updated_at: new Date().toISOString(),
    }

    const { error: shipmentUpdateError } = await updateSingleAdaptive('shipments', shipmentId, updatePayload)
    if (shipmentUpdateError) throw shipmentUpdateError

    res.status(201).json({ success: true, data })
  } catch (err) {
    console.error('Error adding event:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
