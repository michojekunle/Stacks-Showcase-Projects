'use client'

import { Header } from '@/components/header'
import { VaultStats } from '@/components/vault-stats'
import { StatsCards } from '@/components/stats-cards'

export default function StatsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground bitcoin-pattern">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Vault Statistics
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time analytics and performance metrics
          </p>
        </div>
        
        <div className="mb-12">
          <StatsCards />
        </div>
        
        <VaultStats />
      </div>
    </main>
  )
}
