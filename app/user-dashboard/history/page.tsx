'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

interface ApiShipment {
  id: string
  tracking_id?: string
  sender_city?: string
  receiver_city?: string
  sender_address?: string
  receiver_address?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface HistoryShipment {
  id: string
  origin: string
  destination: string
  deliveredAt: string
}

const resolveCity = (city?: string, address?: string) => {
  if (city) return city
  if (!address) return ''
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : address.trim()
}

export default function HistoryPage() {
  const [delivered, setDelivered] = useState<HistoryShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE}/api/shipments?limit=200`)
        if (!res.ok) throw new Error(`Shipments API failed (${res.status})`)

        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to fetch shipments')

        const mapped: HistoryShipment[] = (json.data || [])
          .filter((item: ApiShipment) => (item.status || '').toLowerCase() === 'delivered')
          .map((item: ApiShipment) => {
            const origin = resolveCity(item.sender_city, item.sender_address) || 'Origin'
            const destination = resolveCity(item.receiver_city, item.receiver_address) || 'Destination'
            const deliveredAt = item.updated_at || item.created_at

            return {
              id: item.tracking_id || item.id,
              origin,
              destination,
              deliveredAt: deliveredAt ? new Date(deliveredAt).toLocaleString('en-IN') : 'N/A',
            }
          })

        setDelivered(mapped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-pepi-thin text-on-surface">Delivery History</motion.h1>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">Loading history...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-300">{error}</div>
        ) : delivered.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-surface-container border border-white/10 p-5 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-mono text-on-surface-variant">{s.id}</p>
              <p className="text-on-surface font-medium">{s.origin} <ArrowRight className="w-4 h-4 inline text-on-surface-variant" /> {s.destination}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Delivered</p>
              <p className="text-sm text-emerald-400">{s.deliveredAt}</p>
            </div>
            <button className="text-xs px-3 py-1.5 border border-white/10 text-on-surface-variant hover:border-white/20 transition-colors">Receipt</button>
          </motion.div>
        ))}
        {!loading && !error && delivered.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">No delivery history found.</div>
        )}
      </div>
    </div>
  )
}
