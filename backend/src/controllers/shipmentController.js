import { supabase } from '../config/supabase.js'
import { generateTrackingId } from '../utils/tracking.js'
import { deriveCity } from '../utils/location.js'
import { fetchShipmentEvents } from '../utils/shipmentEvents.js'
import { insertSingleAdaptive, updateSingleAdaptive } from '../utils/supabaseAdaptive.js'

export async function getShipments(req, res) {
  try {
    const { page = 1, limit = 20, status, city } = req.query
    const pageNumber = Number(page) || 1
    const pageSize = Number(limit) || 20
    const offset = (pageNumber - 1) * pageSize

    let query = supabase.from('shipments').select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    if (city) {
      query = query.or(`receiver_address.ilike.%${city}%,sender_address.ilike.%${city}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    res.json({
      success: true,
      data,
      pagination: { page: pageNumber, limit: pageSize, total: count },
    })
  } catch (err) {
    console.error('Error fetching shipments:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function getShipmentById(req, res) {
  try {
    const { id } = req.params

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single()

    if (shipmentError) throw shipmentError

    const { data: events, error: eventsError } = await fetchShipmentEvents(id)

    if (eventsError) throw eventsError

    res.json({ success: true, data: { ...shipment, events } })
  } catch (err) {
    console.error('Error fetching shipment:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function trackShipmentByTrackingId(req, res) {
  try {
    const { trackingId } = req.params

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_id', trackingId)
      .single()

    if (shipmentError) throw shipmentError

    const { data: events, error: eventsError } = await fetchShipmentEvents(shipment.id)

    if (eventsError) throw eventsError

    res.json({ success: true, data: { ...shipment, events } })
  } catch (err) {
    console.error('Error tracking shipment:', err)
    if (err.code === 'PGRST116') {
      res.status(404).json({ success: false, error: 'Shipment not found' })
    } else {
      res.status(500).json({ success: false, error: err.message })
    }
  }
}

export async function createShipment(req, res) {
  try {
    const {
      sender_name,
      sender_phone,
      sender_address,
      sender_city,
      sender_pincode,
      receiver_name,
      receiver_phone,
      receiver_address,
      receiver_city,
      receiver_pincode,
      package_type,
      weight,
      value,
      description,
      estimated_delivery,
    } = req.body

    if (
      !sender_name ||
      !sender_phone ||
      !sender_address ||
      !sender_pincode ||
      !receiver_name ||
      !receiver_phone ||
      !receiver_address ||
      !receiver_pincode ||
      !package_type ||
      !weight ||
      !estimated_delivery
    ) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const tracking_id = generateTrackingId()
    const senderCityResolved = sender_city || deriveCity(null, sender_address)
    const receiverCityResolved = receiver_city || deriveCity(null, receiver_address)

    const shipmentPayload = {
      tracking_id,
      sender_name,
      sender_phone,
      sender_address,
      sender_city: senderCityResolved,
      sender_pincode,
      receiver_name,
      receiver_phone,
      receiver_address,
      receiver_city: receiverCityResolved,
      receiver_pincode,
      package_type,
      weight: parseFloat(weight),
      value: value ? parseFloat(value) : null,
      description,
      status: 'Pending',
      current_location: `${senderCityResolved} Pickup Hub`,
      current_lat: 28.6139,
      current_lng: 77.209,
      estimated_delivery,
    }

    const { data, error } = await insertSingleAdaptive('shipments', shipmentPayload)

    if (error) throw error

    const eventPayload = {
      shipment_id: data.id,
      status: 'Pending',
      location: `${senderCityResolved} Pickup Hub`,
      latitude: 28.6139,
      longitude: 77.209,
      event_type: 'CREATED',
      description: 'Shipment created',
      occurred_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    }

    const { error: eventError } = await insertSingleAdaptive('shipment_events', eventPayload)
    if (eventError) throw eventError

    res.status(201).json({ success: true, data })
  } catch (err) {
    console.error('Error creating shipment:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateShipment(req, res) {
  try {
    const { id } = req.params
    const {
      status,
      current_location,
      current_lat,
      current_lng,
      assigned_agent,
      vehicle_number,
      vehicle_type,
    } = req.body

    const updateData = { updated_at: new Date().toISOString() }

    if (status) updateData.status = status
    if (current_location) updateData.current_location = current_location
    if (current_lat !== undefined) updateData.current_lat = parseFloat(current_lat)
    if (current_lng !== undefined) updateData.current_lng = parseFloat(current_lng)
    if (assigned_agent) updateData.assigned_agent = assigned_agent
    if (vehicle_number) updateData.vehicle_number = vehicle_number
    if (vehicle_type) updateData.vehicle_type = vehicle_type

    const { data, error } = await updateSingleAdaptive('shipments', id, updateData)

    if (error) throw error

    res.json({ success: true, data })
  } catch (err) {
    console.error('Error updating shipment:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
