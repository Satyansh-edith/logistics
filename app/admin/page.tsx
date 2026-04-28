'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FlipCardGrid } from '@/components/flip-card'
import { mockAlerts, mockUserProfiles, mockAnalyticsData } from '@/lib/data'
import type { FlipCardData, Shipment } from '@/lib/types'
import {
  ArrowRight, Eye, Zap, TrendingUp, TrendingDown,
  CheckCircle,
  AlertCircle, XCircle, Plus
} from 'lucide-react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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

interface Statistics {
  total: number
  pending: number
  in_transit: number
  out_for_delivery: number
  delivered: number
}

type AdminShipment = Omit<Shipment, 'id'> & {
  id: string
  trackingId: string
}

const statusColors: Record<string, string> = {
  'in-transit': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  'delivered': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'pending': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'delayed': 'text-red-400 bg-red-400/10 border-red-400/30',
}

const alertTypeIcon: Record<string, React.ReactNode> = {
  warning: <AlertCircle className="w-4 h-4 text-amber-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
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

export default function AdminPage() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const [shipments, setShipments] = useState<AdminShipment[]>([])
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)

        const [shipmentsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/api/shipments?limit=20`),
          fetch(`${API_BASE}/api/statistics`),
        ])

        if (!shipmentsRes.ok) throw new Error(`Shipments API failed (${shipmentsRes.status})`)
        if (!statsRes.ok) throw new Error(`Statistics API failed (${statsRes.status})`)

        const shipmentsJson = await shipmentsRes.json()
        const statsJson = await statsRes.json()

        if (!shipmentsJson.success) throw new Error(shipmentsJson.error || 'Failed to fetch shipments')
        if (!statsJson.success) throw new Error(statsJson.error || 'Failed to fetch statistics')

        const apiShipments: ApiShipment[] = shipmentsJson.data || []
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
          const riskScore = riskResults[index].status === 'fulfilled'
            ? (riskResults[index] as PromiseFulfilledResult<number | null>).value ?? 0
            : 0

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
            route: [
              { city: origin, status: 'completed' },
              { city: destination, status: status === 'delivered' ? 'completed' : 'upcoming' },
            ],
          }
        })

        setShipments(mapped)
        setStats(statsJson.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const quickMetrics = useMemo(() => [
    { label: 'Total Shipments', value: stats ? stats.total.toLocaleString('en-IN') : '--', sub: 'live' },
    { label: 'In Transit', value: stats ? stats.in_transit.toLocaleString('en-IN') : '--', sub: 'live' },
    { label: 'Out for Delivery', value: stats ? stats.out_for_delivery.toLocaleString('en-IN') : '--', sub: 'live' },
    { label: 'Delivered', value: stats ? stats.delivered.toLocaleString('en-IN') : '--', sub: 'live' },
    { label: 'Pending', value: stats ? stats.pending.toLocaleString('en-IN') : '--', sub: 'live' },
    { label: 'Recent Shipments', value: shipments.length.toString(), sub: 'latest 20' },
  ], [stats, shipments.length])

  const flipCards: FlipCardData[] = useMemo(() => {
    if (!stats) return []

    return [
      {
        id: 'fc-total',
        frontTitle: 'Total Shipments',
        frontValue: stats.total,
        frontSubtitle: 'All statuses',
        frontIcon: 'Package',
        frontColor: 'cyan',
        backTitle: 'Shipment Summary',
        backContent: 'Live totals from the logistics database.',
        backStats: [
          { label: 'Pending', value: stats.pending.toString() },
          { label: 'In Transit', value: stats.in_transit.toString() },
          { label: 'Delivered', value: stats.delivered.toString() },
        ],
        backAction: { label: 'View Shipments', href: '/admin/shipments' },
      },
      {
        id: 'fc-transit',
        frontTitle: 'In Transit',
        frontValue: stats.in_transit,
        frontSubtitle: 'Active routes',
        frontIcon: 'TrendingUp',
        frontColor: 'emerald',
        backTitle: 'In-Transit Mix',
        backContent: 'Shipments currently moving between hubs.',
        backStats: [
          { label: 'Out for Delivery', value: stats.out_for_delivery.toString() },
          { label: 'Pending', value: stats.pending.toString() },
        ],
        backAction: { label: 'Track Live', href: '/logistics/track' },
      },
      {
        id: 'fc-delivered',
        frontTitle: 'Delivered',
        frontValue: stats.delivered,
        frontSubtitle: 'Completed',
        frontIcon: 'ClipboardCheck',
        frontColor: 'emerald',
        backTitle: 'Delivered Shipments',
        backContent: 'Successfully completed deliveries.',
        backStats: [
          { label: 'Delivered', value: stats.delivered.toString() },
          { label: 'Total', value: stats.total.toString() },
        ],
        backAction: { label: 'View History', href: '/admin/shipments' },
      },
      {
        id: 'fc-pending',
        frontTitle: 'Pending',
        frontValue: stats.pending,
        frontSubtitle: 'Awaiting dispatch',
        frontIcon: 'Clock',
        frontColor: 'amber',
        backTitle: 'Pending Queue',
        backContent: 'Shipments waiting for assignment or dispatch.',
        backStats: [
          { label: 'Pending', value: stats.pending.toString() },
          { label: 'Total', value: stats.total.toString() },
        ],
        backAction: { label: 'Review Pending', href: '/admin/shipments' },
      },
    ]
  }, [stats])

  return (
    <div className="space-y-8">
      {/* A. Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-pepi-thin text-on-surface">Welcome back, Alex</h1>
          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 font-biotif-pro">ADMIN</span>
        </div>
        <p className="text-on-surface-variant font-biotif-pro mt-1">{dateStr}</p>
      </motion.div>

      {/* B. Flip Card Grid */}
      {flipCards.length > 0 ? (
        <FlipCardGrid cards={flipCards} data-testid="admin-flip-grid" />
      ) : (
        <div className="text-sm text-on-surface-variant">Loading overview cards...</div>
      )}

      {/* C. Quick Metrics Bar */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {quickMetrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="bg-surface-container border border-white/10 p-4"
          >
            <p className="text-xs text-on-surface-variant font-biotif-pro mb-1">{m.label}</p>
            <p className="text-xl font-pepi-thin text-on-surface">{m.value}</p>
            {m.trend && (
              <p className={`text-xs mt-0.5 flex items-center gap-1 ${m.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.trend}
              </p>
            )}
            {m.sub && <p className="text-xs text-on-surface-variant mt-0.5">{m.sub}</p>}
          </motion.div>
        ))}
      </motion.div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/5 text-red-300 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* D. Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Shipments (2/3) */}
        <div className="lg:col-span-2 bg-surface-container-low border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-pepi-thin text-on-surface">Recent Shipments</h2>
            <Link href="/logistics/create" className="flex items-center gap-1 text-xs text-primary border border-primary/30 px-3 py-1.5 hover:bg-primary/10 transition-colors">
              <Plus className="w-3 h-3" /> New Shipment
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-on-surface-variant border-b border-white/10">
                  <th className="text-left pb-3 font-biotif-pro font-medium">ID</th>
                  <th className="text-left pb-3 font-biotif-pro font-medium">Route</th>
                  <th className="text-left pb-3 font-biotif-pro font-medium">Status</th>
                  <th className="text-left pb-3 font-biotif-pro font-medium">Progress</th>
                  <th className="text-left pb-3 font-biotif-pro font-medium">Risk</th>
                  <th className="text-left pb-3 font-biotif-pro font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-on-surface-variant">
                      Loading shipments...
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-on-surface-variant">
                      No shipments found.
                    </td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3 font-mono text-xs text-on-surface-variant">{s.trackingId}</td>
                      <td className="py-3">
                        <span className="text-on-surface">{s.origin}</span>
                        <ArrowRight className="w-3 h-3 text-on-surface-variant inline mx-1" />
                        <span className="text-on-surface">{s.destination}</span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 border ${statusColors[s.status] || 'text-on-surface-variant border-white/10'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 w-24">
                        <div className="h-1 bg-surface-container-high overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-xs text-on-surface-variant">{s.progress}%</span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 border ${
                          (s.riskScore ?? 0) < 30 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' :
                          (s.riskScore ?? 0) < 70 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' :
                          'text-red-400 bg-red-400/10 border-red-400/30'
                        }`}>{s.riskScore ?? 0}%</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/logistics/${s.id}`}>
                            <Eye className="w-4 h-4 text-on-surface-variant hover:text-primary transition-colors" />
                          </Link>
                          <button className="text-on-surface-variant hover:text-emerald-400 transition-colors">
                            <Zap className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-4">
          {/* Recent Alerts */}
          <div className="bg-surface-container-low border border-white/10 p-5">
            <h3 className="text-base font-pepi-thin text-on-surface mb-3">Recent Alerts</h3>
            <div className="space-y-3">
              {mockAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex items-start gap-2">
                  {alertTypeIcon[alert.type]}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface truncate">{alert.message}</p>
                    <p className="text-xs text-on-surface-variant">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/alerts" className="text-xs text-primary hover:underline mt-3 block">View all alerts →</Link>
          </div>

          {/* Pending Approvals mini-list */}
          <div className="bg-surface-container-low border border-white/10 p-5">
            <h3 className="text-base font-pepi-thin text-on-surface mb-3">Pending Approvals</h3>
            <div className="space-y-3">
              {[
                { title: 'Route Override — SHP-004', type: 'urgent', requester: 'Sam Chen' },
                { title: 'New User: david@co.com', type: 'normal', requester: 'System' },
                { title: 'Bulk Export Request', type: 'low', requester: 'Maria Garcia' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-on-surface">{item.title}</p>
                    <p className="text-xs text-on-surface-variant">{item.requester}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="text-xs px-2 py-0.5 bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/20 transition-colors">✓</button>
                    <button className="text-xs px-2 py-0.5 bg-red-400/10 text-red-400 border border-red-400/30 hover:bg-red-400/20 transition-colors">✗</button>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/approvals" className="text-xs text-primary hover:underline mt-3 block">View all →</Link>
          </div>
        </div>
      </div>

      {/* E. Analytics Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-low border border-white/10 p-6">
          <h3 className="text-base font-pepi-thin text-on-surface mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockAnalyticsData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#c4c7c8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#201f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }} />
              <Area type="monotone" dataKey="revenue" stroke="#34d399" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface-container-low border border-white/10 p-6">
          <h3 className="text-base font-pepi-thin text-on-surface mb-4">Efficiency Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={mockAnalyticsData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#c4c7c8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#201f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }} />
              <Line type="monotone" dataKey="efficiency" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* F. User Activity Table */}
      <div className="bg-surface-container-low border border-white/10 p-6">
        <h2 className="text-xl font-pepi-thin text-on-surface mb-4">User Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-on-surface-variant border-b border-white/10">
                <th className="text-left pb-3 font-biotif-pro font-medium">User</th>
                <th className="text-left pb-3 font-biotif-pro font-medium">Role</th>
                <th className="text-left pb-3 font-biotif-pro font-medium">Department</th>
                <th className="text-left pb-3 font-biotif-pro font-medium">Active</th>
                <th className="text-left pb-3 font-biotif-pro font-medium">Performance</th>
                <th className="text-left pb-3 font-biotif-pro font-medium">Last Login</th>
                <th className="text-left pb-3 font-biotif-pro font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockUserProfiles.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="text-on-surface font-medium">{u.name}</p>
                        <p className="text-xs text-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 border ${
                      u.role === 'admin' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                      u.role === 'manager' ? 'text-violet-400 border-violet-400/30 bg-violet-400/10' :
                      'text-cyan-400 border-cyan-400/30 bg-cyan-400/10'
                    }`}>{u.role}</span>
                  </td>
                  <td className="py-3 text-on-surface-variant">{u.department}</td>
                  <td className="py-3 text-on-surface">{u.activeShipments}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-surface-container-high overflow-hidden w-16">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${u.performanceScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-on-surface">{u.performanceScore}</span>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-on-surface-variant">{u.lastLogin}</td>
                  <td className="py-3">
                    <button className="text-xs text-primary hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
