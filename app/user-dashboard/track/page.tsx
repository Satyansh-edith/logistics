'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrackingTimeline } from '@/components/tracking-timeline'
import { mockShipments } from '@/lib/data'
import { Search } from 'lucide-react'

export default function TrackPage() {
  const [trackId, setTrackId] = useState('SHP-001')
  const shipment = mockShipments.find(s => s.id === trackId) ?? mockShipments[0]

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
        <button className="px-6 py-3 bg-primary text-on-primary text-sm hover:bg-primary/90 transition-colors">Track</button>
      </div>

      {/* Shipment info */}
      {shipment && (
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
      )}
    </div>
  )
}
