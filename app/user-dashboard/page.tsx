'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FlipCardGrid } from '@/components/flip-card'
import { TrackingTimeline } from '@/components/tracking-timeline'
import { PerformanceRing } from '@/components/performance-ring'
import { mockUserFlipCards, mockShipments, mockAlerts } from '@/lib/data'
import { MapPin, Plus, History, MessageCircle, Package, ArrowRight, Clock, AlertCircle } from 'lucide-react'

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

const alertTypeColors: Record<string, string> = {
  warning: 'text-amber-400',
  error: 'text-red-400',
  success: 'text-emerald-400',
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
  const activeShipment = mockShipments[0]

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
      <FlipCardGrid cards={mockUserFlipCards} data-testid="user-flip-grid" />

      {/* C. Active Shipments Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-pepi-thin text-on-surface">Active Shipments</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {mockShipments.slice(0, 3).map((s, i) => (
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
