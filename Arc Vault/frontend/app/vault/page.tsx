'use client'

import { Header } from '@/components/header'
import { Dashboard } from '@/components/dashboard'

export default function VaultPage() {
  return (
    <main className="min-h-screen bg-background text-foreground bitcoin-pattern">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Your Vault
          </h1>
          <p className="text-xl text-muted-foreground">
            Deposit and withdraw your assets with ease
          </p>
        </div>
        
        <Dashboard />
      </div>
    </main>
  )
}
