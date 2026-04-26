'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { mockShipments } from '@/lib/data'
import { CheckCircle, ArrowRight, Clock } from 'lucide-react'

export default function HistoryPage() {
  const delivered = mockShipments.filter(s => s.status === 'delivered')

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-pepi-thin text-on-surface">Delivery History</motion.h1>
      <div className="space-y-3">
        {delivered.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-surface-container border border-white/10 p-5 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-mono text-on-surface-variant">{s.id}</p>
              <p className="text-on-surface font-medium">{s.origin} <ArrowRight className="w-4 h-4 inline text-on-surface-variant" /> {s.destination}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Delivered</p>
              <p className="text-sm text-emerald-400">{s.lastUpdate ?? s.createdAt}</p>
            </div>
            <button className="text-xs px-3 py-1.5 border border-white/10 text-on-surface-variant hover:border-white/20 transition-colors">Receipt</button>
          </motion.div>
        ))}
        {delivered.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">No delivery history found.</div>
        )}
      </div>
    </div>
  )
}
