'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Shipment } from '@/lib/types'
import { ArrowRight, Eye, Zap, Plus, Download, CheckSquare } from 'lucide-react'
import { TrackingTimeline } from '@/components/tracking-timeline'

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
  current_location?: string
}

type AdminShipment = Omit<Shipment, 'id'> & {
  id: string
  trackingId: string
  currentLocation: string
}

const statusColors: Record<string, string> = {
  'in-transit': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  'delivered': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'pending': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'delayed': 'text-red-400 bg-red-400/10 border-red-400/30',
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

export default function AdminShipmentsPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [shipments, setShipments] = useState<AdminShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadShipments = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE}/api/shipments?limit=200`)
        if (!res.ok) throw new Error(`Shipments API failed (${res.status})`)

        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to fetch shipments')

        const apiShipments: ApiShipment[] = json.data || []
        const riskResults = await Promise.allSettled(
          apiShipments.map((shipment) =>
            fetch(`${API_BASE}/predict-risk/${shipment.id}`)
              .then((r) => r.json())
              .then((j) => (j.success ? j.data?.riskScore : null))
              .catch(() => null)
          )
        )

        const mapped: AdminShipment[] = apiShipments.map((item, index) => {
          const status = normalizeStatus(item.status)
          const origin = resolveCity(item.sender_city, item.sender_address) || 'Origin'
          const destination = resolveCity(item.receiver_city, item.receiver_address) || 'Destination'
          const currentLocation = item.current_location || origin
          const riskScore = riskResults[index].status === 'fulfilled'
            ? (riskResults[index] as PromiseFulfilledResult<number | null>).value ?? 0
            : 0

          const route = [
            { city: origin, status: 'completed' as const },
            { city: currentLocation, status: status === 'in-transit' ? 'current' as const : 'completed' as const },
            { city: destination, status: status === 'delivered' ? 'completed' as const : 'upcoming' as const },
          ]

          return {
            id: item.id,
            trackingId: item.tracking_id || item.id,
            origin,
            destination,
            status,
            progress: progressForStatus(status),
            eta: item.estimated_delivery ? new Date(item.estimated_delivery).toLocaleDateString('en-IN') : 'N/A',
            weight: item.weight ? `${item.weight} kg` : 'N/A',
            createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : 'N/A',
            lastUpdate: item.updated_at ? new Date(item.updated_at).toLocaleString('en-IN') : 'N/A',
            riskScore,
            route,
            currentLocation,
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

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-pepi-thin text-on-surface">
          All Shipments
        </motion.h1>
        <div className="flex gap-2">
          <Link href="/logistics/create" className="flex items-center gap-1 text-sm px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Create Shipment
          </Link>
          {selected.length > 0 && (
            <div className="flex gap-2">
              <button className="text-sm px-3 py-2 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 transition-colors flex items-center gap-1">
                <CheckSquare className="w-4 h-4" /> Mark Delivered ({selected.length})
              </button>
              <button className="text-sm px-3 py-2 border border-white/10 text-on-surface-variant hover:border-white/20 transition-colors flex items-center gap-1">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-low border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-on-surface-variant">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  className="accent-primary"
                  onChange={(e) => setSelected(e.target.checked ? shipments.map(s => s.id) : [])}
                />
              </th>
              <th className="text-left p-4 font-biotif-pro font-medium">ID</th>
              <th className="text-left p-4 font-biotif-pro font-medium">Route</th>
              <th className="text-left p-4 font-biotif-pro font-medium">Status</th>
              <th className="text-left p-4 font-biotif-pro font-medium">Progress</th>
              <th className="text-left p-4 font-biotif-pro font-medium">Weight</th>
              <th className="text-left p-4 font-biotif-pro font-medium">Risk</th>
              <th className="text-left p-4 font-biotif-pro font-medium">Created</th>
              <th className="text-left p-4 font-biotif-pro font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-on-surface-variant">Loading shipments...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-red-300">{error}</td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-on-surface-variant">No shipments found.</td>
              </tr>
            ) : shipments.map((s) => (
              <React.Fragment key={s.id}>
                <tr
                  className="border-b border-white/5 hover:bg-surface-container/50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  <td className="p-4" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selected.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>
                  <td className="p-4 font-mono text-xs text-on-surface-variant">{s.trackingId}</td>
                  <td className="p-4">
                    <span className="text-on-surface">{s.origin}</span>
                    <ArrowRight className="w-3 h-3 text-on-surface-variant inline mx-1" />
                    <span className="text-on-surface">{s.destination}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 border ${statusColors[s.status] || 'text-on-surface-variant border-white/10'}`}>{s.status}</span>
                  </td>
                  <td className="p-4 w-28">
                    <div className="h-1 bg-surface-container-high mb-1">
                      <div className="h-full bg-primary" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-xs text-on-surface-variant">{s.progress}%</span>
                  </td>
                  <td className="p-4 text-on-surface-variant">{s.weight}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 border ${
                      (s.riskScore ?? 0) < 30 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' :
                      (s.riskScore ?? 0) < 70 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' :
                      'text-red-400 bg-red-400/10 border-red-400/30'
                    }`}>{s.riskScore ?? 0}%</span>
                  </td>
                  <td className="p-4 text-xs text-on-surface-variant">{s.createdAt}</td>
                  <td className="p-4">
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <Link href={`/logistics/${s.id}`}><Eye className="w-4 h-4 text-on-surface-variant hover:text-primary" /></Link>
                      <button><Zap className="w-4 h-4 text-on-surface-variant hover:text-emerald-400" /></button>
                    </div>
                  </td>
                </tr>
                {expanded === s.id && (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 bg-surface-container/30 border-b border-white/10">
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <p className="text-xs text-on-surface-variant mb-3 font-biotif-pro uppercase tracking-wider">Route Timeline</p>
                        <TrackingTimeline route={s.route} />
                      </motion.div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
