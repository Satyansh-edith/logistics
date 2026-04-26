'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShipmentCard } from '@/components/shipment-card'
import { GlassPanel } from '@/components/glass-panel'
import { OptimizeModal } from '@/components/optimize-modal'
import { mockShipments } from '@/lib/data'
import { Search, Download, Plus, Eye, Zap } from 'lucide-react'

type FilterType = 'all' | 'in-transit' | 'delivered' | 'pending' | 'delayed'
type RiskLevel = 'all' | 'low' | 'medium' | 'high'

export default function ShipmentsPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(mockShipments[0].id)
  const [isOptimizeOpen, setIsOptimizeOpen] = useState(false)

  const getRiskLevel = (score: number): RiskLevel => {
    if (score < 30) return 'low'
    if (score < 70) return 'medium'
    return 'high'
  }

  const filteredShipments = mockShipments.filter((ship) => {
    const matchesFilter = filter === 'all' || ship.status === filter
    const matchesSearch =
      ship.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.destination.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk =
      riskFilter === 'all' || getRiskLevel(ship.riskScore || 0) === riskFilter
    return matchesFilter && matchesSearch && matchesRisk
  })

  const selectedShipment = mockShipments.find((s) => s.id === selectedShipmentId)

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-h1 text-on-surface">Shipments</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Track and manage all your active and historical shipments
          </p>
        </div>
        <div className="flex gap-3">
          <button className="glass-panel px-6 py-3 rounded-lg border border-white/20 text-on-surface hover:border-white/40 transition-colors flex items-center gap-2 font-label-caps text-xs uppercase">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-on-primary rounded-lg font-label-caps text-xs uppercase hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Shipment
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <GlassPanel className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg border border-outline-variant">
              <Search className="w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by ID, origin, or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-on-surface placeholder:text-on-surface-variant text-sm"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as RiskLevel)}
              className="px-4 py-2 bg-surface-container-low rounded-lg border border-outline-variant text-on-surface outline-none text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
            {(['all', 'in-transit', 'delivered', 'pending', 'delayed'] as FilterType[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs uppercase transition-all ${
                    filter === status
                      ? 'bg-primary/20 border border-primary/50 text-on-primary'
                      : 'bg-surface-container border border-white/10 text-on-surface-variant hover:border-white/20'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Shipments Table */}
      <GlassPanel className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-label-caps uppercase text-on-surface-variant">
                Shipment ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-label-caps uppercase text-on-surface-variant">
                Route
              </th>
              <th className="px-6 py-4 text-left text-xs font-label-caps uppercase text-on-surface-variant">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-label-caps uppercase text-on-surface-variant">
                Risk Score
              </th>
              <th className="px-6 py-4 text-left text-xs font-label-caps uppercase text-on-surface-variant">
                ETA
              </th>
              <th className="px-6 py-4 text-left text-xs font-label-caps uppercase text-on-surface-variant">
                Last Update
              </th>
              <th className="px-6 py-4 text-left text-xs font-label-caps uppercase text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.map((shipment, i) => {
              const riskLevel = getRiskLevel(shipment.riskScore || 0)
              return (
                <motion.tr
                  key={shipment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-surface-container/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedShipmentId(shipment.id)}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-primary hover:underline">
                      {shipment.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-on-surface">
                      {shipment.origin} → {shipment.destination}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        shipment.status === 'delivered'
                          ? 'bg-emerald-400/20 text-emerald-400'
                          : shipment.status === 'delayed'
                          ? 'bg-error/20 text-error'
                          : shipment.status === 'in-transit'
                          ? 'bg-cyan-400/20 text-cyan-400'
                          : 'bg-yellow-400/20 text-yellow-400'
                      }`}
                    >
                      {shipment.status.charAt(0).toUpperCase() +
                        shipment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            riskLevel === 'low'
                              ? 'bg-emerald-400'
                              : riskLevel === 'medium'
                              ? 'bg-yellow-400'
                              : 'bg-error'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${shipment.riskScore || 0}%` }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant w-8">
                        {shipment.riskScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface">
                    {shipment.eta}
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">
                    {shipment.lastUpdate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedShipmentId(shipment.id)
                          setIsOptimizeOpen(true)
                        }}
                        className="p-2 hover:bg-surface-container rounded transition-colors"
                        title="Optimize"
                      >
                        <Zap className="w-4 h-4 text-primary" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedShipmentId(shipment.id)
                        }}
                        className="p-2 hover:bg-surface-container rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-cyan-400" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </GlassPanel>

      {/* Modal */}
      <OptimizeModal
        isOpen={isOptimizeOpen}
        onClose={() => setIsOptimizeOpen(false)}
        shipmentId={selectedShipmentId || undefined}
      />
    </div>
  )
}
