'use client'

import { Card } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const sharepriceData = [
  { day: 'Day 1', price: 1.0 },
  { day: 'Day 5', price: 1.15 },
  { day: 'Day 10', price: 1.42 },
  { day: 'Day 15', price: 1.68 },
  { day: 'Day 20', price: 2.12 },
  { day: 'Day 25', price: 3.45 },
  { day: 'Day 30', price: 4.85 },
]

const utilizationData = [
  { day: '1', usage: 25 },
  { day: '5', usage: 35 },
  { day: '10', usage: 45 },
  { day: '15', usage: 55 },
  { day: '20', usage: 62 },
  { day: '25', usage: 68 },
  { day: '30', usage: 78 },
]

export function VaultStats() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Vault Statistics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="glass border-primary/20 p-6">
          <p className="text-sm text-muted-foreground mb-4">Total Collateral</p>
          <p className="text-3xl font-bold text-primary">42.5M STX</p>
          <p className="text-xs text-muted-foreground mt-2">↑ 12% from last week</p>
        </Card>

        <Card className="glass border-primary/20 p-6">
          <p className="text-sm text-muted-foreground mb-4">sBTC Reserve</p>
          <p className="text-3xl font-bold text-primary">285 sBTC</p>
          <p className="text-xs text-muted-foreground mt-2">Backing ratio: 0.67%</p>
        </Card>

        <Card className="glass border-primary/20 p-6">
          <p className="text-sm text-muted-foreground mb-4">Vault Utilization</p>
          <p className="text-3xl font-bold text-primary">78%</p>
          <p className="text-xs text-muted-foreground mt-2">High demand this month</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Share Price Chart */}
        <Card className="glass border-primary/20 p-6">
          <h3 className="font-semibold mb-4">Historical Share Price (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sharepriceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(247, 147, 26, 0.1)" />
              <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.9)', 
                  border: '1px solid rgba(247, 147, 26, 0.3)',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="price" stroke="#F7931A" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Utilization Chart */}
        <Card className="glass border-primary/20 p-6">
          <h3 className="font-semibold mb-4">Vault Utilization (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(247, 147, 26, 0.1)" />
              <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.9)', 
                  border: '1px solid rgba(247, 147, 26, 0.3)',
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="usage" fill="rgba(247, 147, 26, 0.2)" stroke="#F7931A" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
