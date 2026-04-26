'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { mockAnalyticsData } from '@/lib/data'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const ranges = ['7D', '30D', '90D', '1Y']

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('30D')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-pepi-thin text-on-surface">
          Analytics
        </motion.h1>
        <div className="flex gap-1">
          {ranges.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-sm px-4 py-1.5 border transition-colors ${
                range === r ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-on-surface-variant hover:border-white/20'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-surface-container-low border border-white/10 p-6">
          <h3 className="text-base font-pepi-thin text-on-surface mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockAnalyticsData}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#c4c7c8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#201f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }} />
              <Area type="monotone" dataKey="revenue" stroke="#34d399" fill="url(#revG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Shipment Volume */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container-low border border-white/10 p-6">
          <h3 className="text-base font-pepi-thin text-on-surface mb-4">Shipment Volume</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockAnalyticsData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#c4c7c8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#201f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }} />
              <Bar dataKey="deliveries" fill="#60a5fa" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-surface-container-low border border-white/10 p-6">
          <h3 className="text-base font-pepi-thin text-on-surface mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[{ name: 'Low', value: 60 }, { name: 'Medium', value: 30 }, { name: 'High', value: 10 }]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                <Cell fill="#34d399" />
                <Cell fill="#fbbf24" />
                <Cell fill="#f87171" />
              </Pie>
              <Legend iconType="square" />
              <Tooltip contentStyle={{ background: '#201f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Efficiency Trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-low border border-white/10 p-6">
          <h3 className="text-base font-pepi-thin text-on-surface mb-4">Efficiency Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockAnalyticsData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#c4c7c8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#201f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }} />
              <Line type="monotone" dataKey="efficiency" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: '$1.84M', color: 'text-emerald-400' },
          { label: 'Total Deliveries', value: '12,470', color: 'text-cyan-400' },
          { label: 'Avg Efficiency', value: '94.5%', color: 'text-violet-400' },
          { label: 'Customer Satisfaction', value: '4.7 / 5', color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container border border-white/10 p-4 text-center">
            <p className={`text-2xl font-pepi-thin ${s.color}`}>{s.value}</p>
            <p className="text-xs text-on-surface-variant font-biotif-pro mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
