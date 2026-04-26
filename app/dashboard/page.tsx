'use client'

import React from 'react'
import Link from 'next/link'
import { Truck, TrendingUp, CheckCircle, Activity, Zap, Brain } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Welcome to LogisTrack</h1>
        <p className="text-on-surface-variant mt-2">
          Production shipment tracking system with AI-powered features
        </p>
      </div>

      {/* Quick Access Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/logistics"
          className="bg-surface-container rounded-lg p-6 border border-outline-variant hover:border-primary transition-colors"
        >
          <Truck className="w-6 h-6 text-primary mb-2" />
          <h3 className="font-semibold text-on-surface mb-1">Shipments</h3>
          <p className="text-sm text-on-surface-variant">Manage all shipments</p>
        </Link>

        <Link
          href="/logistics/create"
          className="bg-surface-container rounded-lg p-6 border border-outline-variant hover:border-primary transition-colors"
        >
          <TrendingUp className="w-6 h-6 text-primary mb-2" />
          <h3 className="font-semibold text-on-surface mb-1">Create</h3>
          <p className="text-sm text-on-surface-variant">Create new shipment</p>
        </Link>

        <Link
          href="/logistics/track"
          className="bg-surface-container rounded-lg p-6 border border-outline-variant hover:border-primary transition-colors"
        >
          <Activity className="w-6 h-6 text-primary mb-2" />
          <h3 className="font-semibold text-on-surface mb-1">Track</h3>
          <p className="text-sm text-on-surface-variant">Track shipments</p>
        </Link>

        <div className="bg-surface-container rounded-lg p-6 border border-outline-variant">
          <CheckCircle className="w-6 h-6 text-primary mb-2" />
          <h3 className="font-semibold text-on-surface mb-1">Dashboard</h3>
          <p className="text-sm text-on-surface-variant">Active shipments: 5</p>
        </div>
      </div>

      {/* AI Features Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-on-surface">AI-Powered Features</h2>
        </div>
        <p className="text-on-surface-variant mb-4">
          Coming soon: Advanced shipment predictions, route optimization, and anomaly detection
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Predictive Analytics */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <Zap className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold text-on-surface mb-2">Predictive Analytics</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              AI-powered delivery time predictions based on historical data and current conditions
            </p>
            <button className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Route Optimization */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <Zap className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold text-on-surface mb-2">Route Optimization</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Intelligent route planning for faster deliveries and reduced costs
            </p>
            <button className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Anomaly Detection */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <Brain className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold text-on-surface mb-2">Anomaly Detection</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Real-time alerts for unusual shipment patterns and potential issues
            </p>
            <button className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Demand Forecasting */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <TrendingUp className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold text-on-surface mb-2">Demand Forecasting</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Predict future shipment demand and optimize inventory planning
            </p>
            <button className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Customer Sentiment Analysis */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <Brain className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold text-on-surface mb-2">Sentiment Analysis</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Analyze customer feedback and satisfaction trends in real-time
            </p>
            <button className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Cost Optimization */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <Zap className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold text-on-surface mb-2">Cost Optimization</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              ML-driven recommendations to reduce logistics costs and improve margins
            </p>
            <button className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-sm font-medium">
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-surface-container rounded-lg p-6 border border-outline-variant">
        <h3 className="font-semibold text-on-surface mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-on-surface-variant mb-1">Backend</p>
            <p className="text-green-500 font-medium">Running</p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant mb-1">Database</p>
            <p className="text-green-500 font-medium">Connected</p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant mb-1">API Status</p>
            <p className="text-green-500 font-medium">Healthy</p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant mb-1">Uptime</p>
            <p className="text-green-500 font-medium">100%</p>
          </div>
        </div>
      </div>
    </div>

  )
}
