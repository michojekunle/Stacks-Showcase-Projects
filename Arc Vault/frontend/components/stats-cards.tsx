'use client'

import { Card } from '@/components/ui/card'
import { DollarSign, TrendingUp, Zap, Lock } from 'lucide-react'
import { NumberTicker } from '@/components/number-ticker'

export function StatsCards() {
  const stats = [
    {
      icon: DollarSign,
      label: 'Total Value Locked',
      value: 42500000,
      suffix: '',
      prefix: '$',
    },
    {
      icon: TrendingUp,
      label: 'vSTX Supply',
      value: 8750000,
      suffix: ' vSTX',
      prefix: '',
    },
    {
      icon: Zap,
      label: 'Share Price',
      value: 4.85,
      suffix: ' STX',
      prefix: '',
      decimals: 2,
    },
    {
      icon: Lock,
      label: 'sBTC Reserve',
      value: 285,
      suffix: ' sBTC',
      prefix: '',
      decimals: 2,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card
            key={i}
            className="glass border-primary/20 p-6 hover:border-primary/40 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary glow-orange" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <div className="text-2xl font-bold number-ticker">
              {stat.prefix}
              <NumberTicker 
                value={stat.value} 
                decimals={stat.decimals}
              />
              {stat.suffix}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
