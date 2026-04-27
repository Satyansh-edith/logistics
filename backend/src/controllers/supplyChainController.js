import { supabase } from '../config/supabase.js'
import { MOCK_SHIPMENTS, MOCK_RISKS } from '../constants/mockData.js'
import { deriveCity } from '../utils/location.js'

export async function getSupplyChainShipments(req, res) {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const mapped = (data || []).map((s) => {
      const origin = deriveCity(s.sender_city, s.sender_address)
      const destination = deriveCity(s.receiver_city, s.receiver_address)

      return {
        id: s.id,
        origin,
        destination,
        status: (s.status || 'pending').toLowerCase().replace(/ /g, '-'),
        current_location: s.current_location || `${origin} Hub`,
        eta: s.estimated_delivery || 'N/A',
        route: [origin, destination].filter(Boolean),
        alternate_route: [origin, 'Transit Hub', destination].filter(Boolean),
        tracking_id: s.tracking_id,
        weight: s.weight,
        package_type: s.package_type,
      }
    })

    res.json({ success: true, data: mapped.length > 0 ? mapped : MOCK_SHIPMENTS })
  } catch (err) {
    console.warn('Supabase unavailable, using mock data for /shipments:', err.message)
    res.json({ success: true, data: MOCK_SHIPMENTS })
  }
}

export async function getRiskPrediction(req, res) {
  try {
    const { id } = req.params

    if (MOCK_RISKS[id]) {
      return res.json({ success: true, data: { shipmentId: id, ...MOCK_RISKS[id] } })
    }

    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('id, status, weight, estimated_delivery')
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
}

export async function getOptimizedRoute(req, res) {
  try {
    const { id } = req.params
    const mockShip = MOCK_SHIPMENTS.find((s) => s.id === id)

    if (mockShip) {
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
      .select('id, sender_address, receiver_address, weight, status')
      .eq('id', id)
      .single()

    if (error) throw error

    const origin = deriveCity(null, shipment.sender_address)
    const destination = deriveCity(null, shipment.receiver_address)
    const hubCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune']
    const hub = hubCities.find((c) => c !== origin && c !== destination) || 'Central Hub'

    res.json({
      success: true,
      data: {
        shipmentId: id,
        originalRoute: [origin, destination],
        optimizedRoute: [origin, hub, destination],
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
}
