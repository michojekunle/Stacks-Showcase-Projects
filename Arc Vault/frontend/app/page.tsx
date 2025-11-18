'use client'

import { Header } from '@/components/header'
import { StatsCards } from '@/components/stats-cards'
import { Dashboard } from '@/components/dashboard'
import { VaultStats } from '@/components/vault-stats'
import { AdminPanel } from '@/components/admin-panel'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground bitcoin-pattern">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero & Stats Section */}
        <section className="mb-16">
          <div className="mb-10">
            <h1 className="text-balance text-4xl md:text-5xl font-bold mb-4">
              Earn Native Bitcoin Yield on Your STX
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Deposit STX → Receive vSTX → Auto-compounded + sBTC backing. Experience institutional-grade yield farming on Stacks.
            </p>
          </div>
          <StatsCards />
        </section>

        {/* Main Dashboard */}
        <section className="mb-16">
          <Dashboard />
        </section>

        {/* Vault Statistics */}
        <section className="mb-16">
          <VaultStats />
        </section>

        {/* Admin Panel */}
        <section className="mb-16">
          <AdminPanel />
        </section>
      </div>
    </main>
  )
}
