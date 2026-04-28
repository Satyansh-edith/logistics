'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FlipCard } from '@/components/flip-card'
import type { FlipCardData, Shipment } from '@/lib/types'

const tabs = ['Active', 'Delivered', 'Pending', 'Delayed']
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

interface ApiShipment {
  id: string
  tracking_id?: string
  sender_city?: string
  receiver_city?: string
  sender_address?: string
  receiver_address?: string
  status?: string
  weight?: number
  estimated_delivery?: string
  created_at?: string
  updated_at?: string
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

export default function MyShipmentsPage() {
  const [tab, setTab] = useState('Active')
  const [search, setSearch] = useState('')
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadShipments = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE}/api/shipments?limit=200`)
        if (!res.ok) throw new Error(`Failed to load shipments (${res.status})`)

        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to load shipments')

        const mapped: Shipment[] = (json.data || []).map((item: ApiShipment) => {
          const status = normalizeStatus(item.status)
          const origin = resolveCity(item.sender_city, item.sender_address) || 'Origin'
          const destination = resolveCity(item.receiver_city, item.receiver_address) || 'Destination'

          return {
            id: item.tracking_id || item.id,
            origin,
            destination,
            status,
            progress: progressForStatus(status),
            eta: item.estimated_delivery ? new Date(item.estimated_delivery).toLocaleDateString('en-IN') : 'N/A',
            weight: item.weight ? `${item.weight} kg` : 'N/A',
            createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : 'N/A',
            lastUpdate: item.updated_at ? new Date(item.updated_at).toLocaleString('en-IN') : 'N/A',
            route: [
              { city: origin, status: 'completed', timestamp: item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : undefined },
              { city: destination, status: status === 'delivered' ? 'completed' : 'upcoming' },
            ],
          }
        })

        setShipments(mapped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shipments')
      } finally {
        setLoading(false)
      }
    }

    loadShipments()
  }, [])

  const filtered = shipments.filter(s => {
    const matchTab = tab === 'Active' ? ['in-transit'].includes(s.status) :
                     tab === 'Delivered' ? s.status === 'delivered' :
                     tab === 'Pending' ? s.status === 'pending' :
                     s.status === 'delayed'
    const q = search.toLowerCase()
    const matchSearch = !q || s.id.toLowerCase().includes(q) || s.origin.toLowerCase().includes(q) || s.destination.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const shipmentFlipCards: FlipCardData[] = filtered.map(s => ({
    id: s.id,
    frontTitle: `${s.origin} → ${s.destination}`,
    frontValue: s.status.replace('-', ' ').toUpperCase(),
    frontSubtitle: `ETA: ${s.eta} · ${s.progress}% complete`,
    frontIcon: 'Package',
    frontColor: s.status === 'delivered' ? 'emerald' : s.status === 'delayed' ? 'amber' : 'cyan',
    backTitle: s.id,
    backContent: `Weight: ${s.weight} · Created: ${s.createdAt} · Last update: ${s.lastUpdate ?? 'N/A'}`,
    backStats: [
      { label: 'Risk Score', value: `${s.riskScore ?? 0}%` },
      { label: 'Route Stops', value: `${s.route.length}` },
      { label: 'Progress', value: `${s.progress}%` },
    ],
    backAction: { label: 'Track Live', href: `/user-dashboard/track?id=${s.id}` },
  }))

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-pepi-thin text-on-surface">My Shipments</motion.h1>
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`text-sm px-4 py-1.5 border transition-colors ${tab === t ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-on-surface-variant hover:border-white/20'}`}>{t}</button>
          ))}
        </div>
        <input type="text" placeholder="Search by ID, origin, destination…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-40 px-3 py-1.5 bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant text-sm outline-none focus:border-primary/40" />
      </div>
      {loading ? (
        <div className="text-center py-16 text-on-surface-variant">Loading shipments...</div>
      ) : error ? (
        <div className="text-center py-16 text-red-300">{error}</div>
      ) : shipmentFlipCards.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">No shipments found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shipmentFlipCards.map((card, i) => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <FlipCard data={card} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
