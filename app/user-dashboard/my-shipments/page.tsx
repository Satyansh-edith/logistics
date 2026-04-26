'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FlipCard } from '@/components/flip-card'
import { TrackingTimeline } from '@/components/tracking-timeline'
import { mockShipments } from '@/lib/data'
import type { FlipCardData } from '@/lib/types'
import { ArrowRight, Clock, MapPin } from 'lucide-react'

const tabs = ['Active', 'Delivered', 'Pending', 'Delayed']

export default function MyShipmentsPage() {
  const [tab, setTab] = useState('Active')
  const [search, setSearch] = useState('')

  const filtered = mockShipments.filter(s => {
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
      {shipmentFlipCards.length === 0 ? (
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
