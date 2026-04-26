import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
// trigger nodemon restart

const app = express()
const PORT = process.env.PORT || 3001

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Middleware
app.use(cors())
app.use(express.json())

// Utility function to generate tracking ID
function generateTrackingId() {
  const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `IND${timestamp}${random}`
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// ==== SHIPMENT ENDPOINTS ====

// GET all shipments with pagination
app.get('/api/shipments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, city } = req.query
    const offset = (page - 1) * limit

    let query = supabase.from('shipments').select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    if (city) {
      query = query.or(`receiver_city.eq.${city},sender_city.eq.${city}`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      success: true,
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count },
    })
  } catch (err) {
    console.error('Error fetching shipments:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET shipment by ID (admin)
app.get('/api/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single()

    if (shipmentError) throw shipmentError

    const { data: events, error: eventsError } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', id)
      .order('occurred_at', { ascending: true })

    if (eventsError) throw eventsError

    res.json({ success: true, data: { ...shipment, events } })
  } catch (err) {
    console.error('Error fetching shipment:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET shipment by tracking ID (public - customer tracking)
app.get('/api/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_id', trackingId)
      .single()

    if (shipmentError) throw shipmentError

    const { data: events, error: eventsError } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('occurred_at', { ascending: true })

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
})

// POST create shipment
app.post('/api/shipments', async (req, res) => {
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

    // Validate required fields
    if (
      !sender_name ||
      !sender_phone ||
      !sender_address ||
      !sender_city ||
      !sender_pincode ||
      !receiver_name ||
      !receiver_phone ||
      !receiver_address ||
      !receiver_city ||
      !receiver_pincode ||
      !package_type ||
      !weight ||
      !estimated_delivery
    ) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const tracking_id = generateTrackingId()

    const { data, error } = await supabase
      .from('shipments')
      .insert({
        tracking_id,
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
        weight: parseFloat(weight),
        value: value ? parseFloat(value) : null,
        description,
        status: 'Pending',
        current_location: `${sender_city} Pickup Hub`,
        current_lat: 28.6139,
        current_lng: 77.209,
        estimated_delivery,
      })
      .select()
      .single()

    if (error) throw error

    // Create initial pickup event
    await supabase.from('shipment_events').insert({
      shipment_id: data.id,
      status: 'Pending',
      location: `${sender_city} Pickup Hub`,
      latitude: 28.6139,
      longitude: 77.209,
      event_type: 'CREATED',
      description: 'Shipment created',
      occurred_at: new Date().toISOString(),
    })

    res.status(201).json({ success: true, data })
  } catch (err) {
    console.error('Error creating shipment:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT update shipment
app.put('/api/shipments/:id', async (req, res) => {
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

    const { data, error } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (err) {
    console.error('Error updating shipment:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ==== EVENT ENDPOINTS ====

// GET events for a shipment
app.get('/api/shipments/:shipmentId/events', async (req, res) => {
  try {
    const { shipmentId } = req.params

    const { data, error } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('occurred_at', { ascending: true })

    if (error) throw error

    res.json({ success: true, data })
  } catch (err) {
    console.error('Error fetching events:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST add event to shipment
app.post('/api/shipments/:shipmentId/events', async (req, res) => {
  try {
    const { shipmentId } = req.params
    const { status, location, latitude, longitude, event_type, description, agent_name } = req.body

    if (!status || !location) {
      return res.status(400).json({ success: false, error: 'Missing status or location' })
    }

    // Add event to database
    const { data, error } = await supabase
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        status,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        event_type,
        description,
        agent_name,
        occurred_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Update shipment status and location
    await supabase
      .from('shipments')
      .update({
        status,
        current_location: location,
        ...(latitude && { current_lat: parseFloat(latitude) }),
        ...(longitude && { current_lng: parseFloat(longitude) }),
        ...(agent_name && { assigned_agent: agent_name }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)

    res.status(201).json({ success: true, data })
  } catch (err) {
    console.error('Error adding event:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ==== SUPPLY CHAIN ENDPOINTS ====

const MOCK_SHIPMENTS = [
  { id: 'sc-001', origin: 'Mumbai', destination: 'Delhi', status: 'in-transit', current_location: 'Jaipur Transit Hub', eta: '2024-12-28', route: ['Mumbai', 'Delhi'], alternate_route: ['Mumbai', 'Jaipur', 'Delhi'], tracking_id: 'IND001', weight: 12, package_type: 'Electronics' },
  { id: 'sc-002', origin: 'Bangalore', destination: 'Chennai', status: 'delivered', current_location: 'Chennai Delivery Hub', eta: '2024-12-26', route: ['Bangalore', 'Chennai'], alternate_route: ['Bangalore', 'Vellore', 'Chennai'], tracking_id: 'IND002', weight: 5, package_type: 'Clothing' },
  { id: 'sc-003', origin: 'Hyderabad', destination: 'Pune', status: 'pending', current_location: 'Hyderabad Pickup Hub', eta: '2024-12-30', route: ['Hyderabad', 'Pune'], alternate_route: ['Hyderabad', 'Solapur', 'Pune'], tracking_id: 'IND003', weight: 25, package_type: 'Furniture' },
  { id: 'sc-004', origin: 'Kolkata', destination: 'Bhubaneswar', status: 'delayed', current_location: 'Kharagpur Checkpoint', eta: '2024-12-29', route: ['Kolkata', 'Bhubaneswar'], alternate_route: ['Kolkata', 'Balasore', 'Bhubaneswar'], tracking_id: 'IND004', weight: 8, package_type: 'Medical' },
  { id: 'sc-005', origin: 'Delhi', destination: 'Amritsar', status: 'in-transit', current_location: 'Ludhiana Transit', eta: '2024-12-27', route: ['Delhi', 'Amritsar'], alternate_route: ['Delhi', 'Ambala', 'Amritsar'], tracking_id: 'IND005', weight: 3, package_type: 'Documents' },
  { id: 'sc-006', origin: 'Ahmedabad', destination: 'Surat', status: 'in-transit', current_location: 'Anand Transit', eta: '2024-12-27', route: ['Ahmedabad', 'Surat'], alternate_route: ['Ahmedabad', 'Vadodara', 'Surat'], tracking_id: 'IND006', weight: 18, package_type: 'Auto Parts' },
]

const MOCK_RISKS = {
  'sc-001': { riskScore: 72, riskLevel: 'high', weatherImpact: 28, trafficImpact: 44, weatherCondition: 'Storm', trafficType: 'Heavy' },
  'sc-002': { riskScore: 12, riskLevel: 'low', weatherImpact: 5, trafficImpact: 7, weatherCondition: 'Clear', trafficType: 'Light' },
  'sc-003': { riskScore: 45, riskLevel: 'medium', weatherImpact: 15, trafficImpact: 30, weatherCondition: 'Cloudy', trafficType: 'Moderate' },
  'sc-004': { riskScore: 85, riskLevel: 'high', weatherImpact: 40, trafficImpact: 45, weatherCondition: 'Rain', trafficType: 'Congested' },
  'sc-005': { riskScore: 30, riskLevel: 'low', weatherImpact: 10, trafficImpact: 20, weatherCondition: 'Clear', trafficType: 'Light' },
  'sc-006': { riskScore: 55, riskLevel: 'medium', weatherImpact: 20, trafficImpact: 35, weatherCondition: 'Fog', trafficType: 'Moderate' },
}

// GET /shipments — supply chain alias that maps real shipment fields (with mock fallback)
app.get('/shipments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const mapped = (data || []).map((s) => ({
      id: s.id,
      origin: s.sender_city || 'Unknown',
      destination: s.receiver_city || 'Unknown',
      status: (s.status || 'pending').toLowerCase().replace(/ /g, '-'),
      current_location: s.current_location || s.sender_city || 'Unknown',
      eta: s.estimated_delivery || 'N/A',
      route: [s.sender_city, s.receiver_city].filter(Boolean),
      alternate_route: [s.sender_city, 'Transit Hub', s.receiver_city].filter(Boolean),
      tracking_id: s.tracking_id,
      weight: s.weight,
      package_type: s.package_type,
    }))

    // Use mock data if DB is empty
    res.json({ success: true, data: mapped.length > 0 ? mapped : MOCK_SHIPMENTS })
  } catch (err) {
    console.warn('Supabase unavailable, using mock data for /shipments:', err.message)
    res.json({ success: true, data: MOCK_SHIPMENTS })
  }
})

// GET /predict-risk/:id — AI risk prediction (with mock fallback)
app.get('/predict-risk/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Return mock if available
    if (MOCK_RISKS[id]) {
      return res.json({ success: true, data: { shipmentId: id, ...MOCK_RISKS[id] } })
    }

    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('id, status, weight, estimated_delivery, sender_city, receiver_city')
      .eq('id', id)
      .single()

    if (error) throw error

    const weightFactor = Math.min((shipment.weight || 1) / 50, 1) * 30
    const statusFactor = shipment.status === 'In Transit' ? 20 : shipment.status === 'Pending' ? 40 : 10
    const seed = id.charCodeAt(0) % 30
    const riskScore = Math.round(weightFactor + statusFactor + seed)
    const riskLevel = riskScore > 60 ? 'high' : riskScore > 35 ? 'medium' : 'low'
    const weatherConditions = ['Clear', 'Cloudy', 'Rain', 'Storm', 'Fog']
    const trafficTypes = ['Light', 'Moderate', 'Heavy', 'Congested']

    res.json({
      success: true,
      data: {
        shipmentId: id,
        riskScore,
        riskLevel,
        weatherImpact: Math.round(weightFactor),
        trafficImpact: Math.round(statusFactor + seed),
        weatherCondition: weatherConditions[id.charCodeAt(1) % weatherConditions.length],
        trafficType: trafficTypes[id.charCodeAt(2) % trafficTypes.length],
      },
    })
  } catch (err) {
    console.warn('Supabase unavailable, generating risk data for:', req.params.id)
    const id = req.params.id
    const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 80
    const riskScore = 20 + seed
    res.json({
      success: true,
      data: {
        shipmentId: id,
        riskScore,
        riskLevel: riskScore > 60 ? 'high' : riskScore > 35 ? 'medium' : 'low',
        weatherImpact: Math.round(seed * 0.4),
        trafficImpact: Math.round(seed * 0.6),
        weatherCondition: ['Clear', 'Rain', 'Storm', 'Fog', 'Cloudy'][seed % 5],
        trafficType: ['Light', 'Moderate', 'Heavy', 'Congested'][seed % 4],
      },
    })
  }
})

// GET /optimize-route/:id — AI route optimization (with mock fallback)
app.get('/optimize-route/:id', async (req, res) => {
  try {
    const { id } = req.params
    const mockShip = MOCK_SHIPMENTS.find((s) => s.id === id)

    if (mockShip) {
      const hub = mockShip.alternate_route[1] || 'Central Hub'
      return res.json({
        success: true,
        data: {
          shipmentId: id,
          originalRoute: mockShip.route,
          optimizedRoute: mockShip.alternate_route,
          timeSaved: 2,
          costSaved: 450,
          riskReduction: 30,
          confidence: 91,
          distance: '780 km',
        },
      })
    }

    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('id, sender_city, receiver_city, weight, status')
      .eq('id', id)
      .single()

    if (error) throw error

    const origin = shipment.sender_city || 'Origin'
    const dest = shipment.receiver_city || 'Destination'
    const hubCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune']
    const hub = hubCities.find((c) => c !== origin && c !== dest) || 'Central Hub'

    res.json({
      success: true,
      data: {
        shipmentId: id,
        originalRoute: [origin, dest],
        optimizedRoute: [origin, hub, dest],
        timeSaved: Math.floor(Math.random() * 4) + 1,
        costSaved: Math.floor(Math.random() * 800) + 200,
        riskReduction: Math.floor(Math.random() * 25) + 10,
        confidence: Math.floor(Math.random() * 15) + 82,
        distance: `${Math.floor(Math.random() * 1000) + 500} km`,
      },
    })
  } catch (err) {
    console.warn('Supabase unavailable, using mock optimization for:', req.params.id)
    res.json({
      success: true,
      data: {
        shipmentId: req.params.id,
        originalRoute: ['Origin City', 'Destination City'],
        optimizedRoute: ['Origin City', 'Central Hub', 'Destination City'],
        timeSaved: 3,
        costSaved: 600,
        riskReduction: 28,
        confidence: 88,
        distance: '650 km',
      },
    })
  }
})

// ==== STATISTICS ENDPOINTS ====

// GET shipment statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const { data, error } = await supabase.from('shipments').select('status')

    if (error) throw error

    const stats = {
      total: data.length,
      pending: data.filter((s) => s.status === 'Pending').length,
      in_transit: data.filter((s) => s.status === 'In Transit').length,
      out_for_delivery: data.filter((s) => s.status === 'Out for Delivery').length,
      delivered: data.filter((s) => s.status === 'Delivered').length,
    }

    res.json({ success: true, data: stats })
  } catch (err) {
    console.error('Error fetching statistics:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Shipment Tracking API running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
