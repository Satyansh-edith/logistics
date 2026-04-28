'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrackingTimeline } from '@/components/tracking-timeline'
import type { Shipment } from '@/lib/types'
import { Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

interface ApiShipmentEvent {
  id: string
  status: string
  location: string
  occurred_at?: string
  timestamp?: string
}

interface ApiShipment {
  id: string
  tracking_id: string
  sender_city?: string
  receiver_city?: string
  sender_address?: string
  receiver_address?: string
  status?: string
  weight?: number
  estimated_delivery?: string
  created_at?: string
  updated_at?: string
  events?: ApiShipmentEvent[]
}

const normalizeStatus = (status?: string): Shipment['status'] => {
  switch ((status || '').toLowerCase()) {
    case 'in transit':
      return 'in-transit'
    case 'out for delivery':
      return 'in-transit'
    case 'delivered':
      return 'delivered'
    case 'pending':
      return 'pending'
    case 'delayed':
      return 'delayed'
    default:
      return 'pending'
  }
}

const resolveCity = (city?: string, address?: string) => {
  if (city) return city
  if (!address) return ''
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : address.trim()
}

const progressForStatus = (status: Shipment['status']) => {
  switch (status) {
    case 'pending':
      return 10
    case 'in-transit':
      return 60
    case 'delivered':
      return 100
    case 'delayed':
      return 40
    default:
      return 0
  }
}

export default function TrackPage() {
  const searchParams = useSearchParams()
  const initialId = searchParams.get('id') || ''
  const [trackId, setTrackId] = useState(initialId)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialId) return
    setTrackId(initialId)
    fetchShipment(initialId)
  }, [initialId])

  const buildRoute = (events: ApiShipmentEvent[] | undefined, origin: string, destination: string): Shipment['route'] => {
    if (events && events.length > 0) {
      const sorted = [...events].sort((a, b) => {
        const aTime = new Date(a.occurred_at || a.timestamp || 0).getTime()
        const bTime = new Date(b.occurred_at || b.timestamp || 0).getTime()
        return aTime - bTime
      })
      return sorted.map((event, index) => ({
        city: event.location,
        status: index === sorted.length - 1 ? 'current' : 'completed',
        timestamp: event.occurred_at || event.timestamp,
      }))
    }

    return [
      { city: origin, status: 'completed' },
      { city: destination, status: 'upcoming' },
    ]
  }

  const fetchShipment = async (id: string) => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE}/api/track/${encodeURIComponent(id)}`)
      if (!res.ok) throw new Error(`Tracking API failed (${res.status})`)

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to fetch shipment')

      const data: ApiShipment = json.data
      const status = normalizeStatus(data.status)
      const origin = resolveCity(data.sender_city, data.sender_address) || 'Origin'
      const destination = resolveCity(data.receiver_city, data.receiver_address) || 'Destination'

      const mapped: Shipment = {
        id: data.tracking_id || data.id,
        origin,
        destination,
        status,
        progress: progressForStatus(status),
        eta: data.estimated_delivery ? new Date(data.estimated_delivery).toLocaleDateString('en-IN') : 'N/A',
        weight: data.weight ? `${data.weight} kg` : 'N/A',
        createdAt: data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN') : 'N/A',
        lastUpdate: data.updated_at ? new Date(data.updated_at).toLocaleString('en-IN') : 'N/A',
        route: buildRoute(data.events, origin, destination),
      }

      setShipment(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shipment')
      setShipment(null)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-pepi-thin text-on-surface">Track Package</motion.h1>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Enter tracking ID (e.g. SHP-001)"
            value={trackId}
            onChange={e => setTrackId(e.target.value.toUpperCase())}
            className="w-full pl-10 pr-4 py-3 bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary/40 text-sm"
          />
        </div>
        <button
          onClick={() => fetchShipment(trackId)}
          className="px-6 py-3 bg-primary text-on-primary text-sm hover:bg-primary/90 transition-colors"
        >
          Track
        </button>
      </div>

      {/* Shipment info */}
      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading shipment...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-300">{error}</div>
      ) : shipment ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: shipment summary */}
          <div className="bg-surface-container-low border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-on-surface-variant">{shipment.id}</p>
                <h2 className="text-xl font-pepi-thin text-on-surface">{shipment.origin} → {shipment.destination}</h2>
              </div>
              <span className="text-sm px-3 py-1 bg-primary/10 border border-primary/30 text-primary">{shipment.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-on-surface-variant text-xs">ETA</p><p className="text-on-surface">{shipment.eta}</p></div>
              <div><p className="text-on-surface-variant text-xs">Weight</p><p className="text-on-surface">{shipment.weight}</p></div>
              <div><p className="text-on-surface-variant text-xs">Progress</p><p className="text-on-surface">{shipment.progress}%</p></div>
              <div><p className="text-on-surface-variant text-xs">Risk Score</p><p className="text-on-surface">{shipment.riskScore ?? 0}%</p></div>
            </div>
            <div className="h-1.5 bg-surface-container-high mt-4">
              <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${shipment.progress}%` }} transition={{ duration: 1 }} />
            </div>

            {/* Countdown */}
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-on-surface-variant mb-1">Estimated Delivery</p>
              <p className="text-2xl font-pepi-thin text-primary">{shipment.eta}</p>
            </div>

            {/* Share */}
            <button
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/logistics/track?id=${shipment.id}`)}
              className="mt-3 w-full text-xs py-2 border border-white/10 text-on-surface-variant hover:border-white/20 hover:text-on-surface transition-colors"
            >
              📋 Copy Tracking Link
            </button>
          </div>

          {/* Right: timeline */}
          <div className="bg-surface-container-low border border-white/10 p-6">
            <h3 className="text-lg font-pepi-thin text-on-surface mb-4">Route Timeline</h3>
            <TrackingTimeline route={shipment.route} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-on-surface-variant">Enter a tracking ID to view details.</div>
      )}
    </div>
  )
}
