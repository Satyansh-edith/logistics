'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FlipCardGrid } from '@/components/flip-card'
import { TrackingTimeline } from '@/components/tracking-timeline'
import { PerformanceRing } from '@/components/performance-ring'
import { mockAlerts } from '@/lib/data'
import type { FlipCardData, Shipment } from '@/lib/types'
import { MapPin, Plus, History, MessageCircle, ArrowRight, Clock } from 'lucide-react'

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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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

// Notification flip card data from alerts
const notifFlipCards = mockAlerts.slice(0, 3).map((a, i) => ({
  id: `NOTIF-${i}`,
  frontTitle: a.alertType ?? 'alert',
  frontValue: a.type.toUpperCase(),
  frontSubtitle: a.timestamp,
  frontIcon: a.type === 'success' ? 'Star' : a.type === 'error' ? 'Bell' : 'Bell',
  frontColor: a.type === 'success' ? 'emerald' : a.type === 'error' ? 'amber' : 'amber',
  backTitle: 'Full Alert',
  backContent: a.message,
  backStats: a.shipmentId ? [{ label: 'Shipment', value: a.shipmentId }] : undefined,
  backAction: a.shipmentId ? { label: 'View Shipment', href: `/logistics/${a.shipmentId}` } : undefined,
}))

const quickActions = [
  { label: 'Track Package', icon: MapPin, href: '/user-dashboard/track', color: 'text-cyan-400' },
  { label: 'Create Shipment', icon: Plus, href: '/logistics/create', color: 'text-emerald-400' },
  { label: 'View History', icon: History, href: '/user-dashboard/history', color: 'text-violet-400' },
  { label: 'Contact Support', icon: MessageCircle, href: 'mailto:support@smartlogistics.com', color: 'text-amber-400' },
]

export default function UserDashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadShipments = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE}/api/shipments?limit=50`)
        if (!res.ok) throw new Error(`Shipments API failed (${res.status})`)

        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to fetch shipments')

        const mapped: Shipment[] = (json.data || []).map((item: ApiShipment) => {
          const status = normalizeStatus(item.status)
          const origin = resolveCity(item.sender_city, item.sender_address) || 'Origin'
          const destination = resolveCity(item.receiver_city, item.receiver_address) || 'Destination'
          const currentLocation = item.current_location || origin

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
              { city: origin, status: 'completed' },
              { city: currentLocation, status: status === 'in-transit' ? 'current' : 'completed' },
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

  const userFlipCards: FlipCardData[] = useMemo(() => {
    const total = shipments.length
    const delivered = shipments.filter((s) => s.status === 'delivered').length
    const active = shipments.filter((s) => s.status === 'in-transit').length
    const pending = shipments.filter((s) => s.status === 'pending').length

    return [
      {
        id: 'ufc-total',
        frontTitle: 'Total Shipments',
        frontValue: total,
        frontSubtitle: 'Live data',
        frontIcon: 'Package',
        frontColor: 'cyan',
        backTitle: 'Shipment Summary',
        backContent: 'Totals based on current database data.',
        backStats: [
          { label: 'Delivered', value: delivered.toString() },
          { label: 'In Transit', value: active.toString() },
          { label: 'Pending', value: pending.toString() },
        ],
        backAction: { label: 'View Shipments', href: '/user-dashboard/my-shipments' },
      },
      {
        id: 'ufc-active',
        frontTitle: 'In Transit',
        frontValue: active,
        frontSubtitle: 'Active now',
        frontIcon: 'TrendingUp',
        frontColor: 'emerald',
        backTitle: 'Active Shipments',
        backContent: 'Shipments currently moving between hubs.',
        backAction: { label: 'Track Live', href: '/user-dashboard/track' },
      },
      {
        id: 'ufc-delivered',
        frontTitle: 'Delivered',
        frontValue: delivered,
        frontSubtitle: 'Completed',
        frontIcon: 'ClipboardCheck',
        frontColor: 'emerald',
        backTitle: 'Delivered Shipments',
        backContent: 'Completed deliveries from live data.',
        backAction: { label: 'View History', href: '/user-dashboard/history' },
      },
      {
        id: 'ufc-pending',
        frontTitle: 'Pending',
        frontValue: pending,
        frontSubtitle: 'Awaiting dispatch',
        frontIcon: 'Clock',
        frontColor: 'amber',
        backTitle: 'Pending Queue',
        backContent: 'Shipments waiting for dispatch.',
        backAction: { label: 'View Shipments', href: '/user-dashboard/my-shipments' },
      },
    ]
  }, [shipments])

  const activeShipments = shipments.filter((s) => s.status !== 'delivered').slice(0, 3)

  return (
    <div className="space-y-8">
      {/* A. Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-pepi-thin text-on-surface">
          {getGreeting()}, Sam 👋
        </h1>
        <p className="text-on-surface-variant font-biotif-pro mt-1">
          You have <span className="text-amber-400 font-semibold">3 pending actions</span> and{' '}
          <span className="text-cyan-400 font-semibold">2 arriving today</span>.
        </p>
      </motion.div>

      {/* B. Flip Card Grid */}
      <FlipCardGrid cards={userFlipCards} data-testid="user-flip-grid" />

      {/* C. Active Shipments Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-pepi-thin text-on-surface">Active Shipments</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="text-on-surface-variant">Loading shipments...</div>
          ) : error ? (
            <div className="text-red-300">{error}</div>
          ) : activeShipments.length === 0 ? (
            <div className="text-on-surface-variant">No active shipments found.</div>
          ) : activeShipments.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-surface-container border border-white/10 p-5 ${i === 0 ? 'lg:col-span-1' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-on-surface-variant">{s.id}</p>
                  <p className="text-sm font-medium text-on-surface flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {s.origin}
                    <ArrowRight className="w-3 h-3 text-on-surface-variant" />
                    {s.destination}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 border ${statusColors[s.status]}`}>
                  {s.status}
                </span>
              </div>
              <div className="h-1 bg-surface-container-high mb-3">
                <div className="h-full bg-primary transition-all" style={{ width: `${s.progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ETA: {s.eta}
                </span>
                <Link href={`/user-dashboard/track?id=${s.id}`} className="text-primary hover:underline">
                  Track →
                </Link>
              </div>
              {/* Full timeline only for first shipment */}
              {i === 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <TrackingTimeline route={s.route} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* D. Quick Actions */}
      <div>
        <h2 className="text-xl font-pepi-thin text-on-surface mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={action.href}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-container border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <action.icon className={`w-8 h-8 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-biotif-pro text-on-surface-variant group-hover:text-on-surface transition-colors text-center">
                  {action.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* E. Notifications (flip cards) */}
      <div>
        <h2 className="text-xl font-pepi-thin text-on-surface mb-4">Recent Notifications</h2>
        <FlipCardGrid cards={notifFlipCards} />
      </div>

      {/* F. Performance snapshot */}
      <div className="bg-surface-container-low border border-white/10 p-6">
        <h2 className="text-xl font-pepi-thin text-on-surface mb-6">My Performance</h2>
        <div className="flex flex-wrap items-center gap-8">
          <PerformanceRing score={88} size={140} label="Overall Score" />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Delivery Accuracy', value: 94, color: 'bg-emerald-400' },
              { label: 'Response Time', value: 92, color: 'bg-cyan-400' },
              { label: 'Documentation', value: 78, color: 'bg-amber-400' },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-on-surface-variant font-biotif-pro">{m.label}</span>
                  <span className="text-on-surface">{m.value}%</span>
                </div>
                <div className="h-1.5 bg-surface-container-high overflow-hidden">
                  <motion.div
                    className={`h-full ${m.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
