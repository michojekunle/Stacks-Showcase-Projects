'use client'

import { Header } from '@/components/header'
import { StatsCards } from '@/components/stats-cards'
import { ArrowRight, Zap, Shield, TrendingUp, Bitcoin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground bitcoin-pattern">
      <Header />
      
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <section className="mb-24 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-orange animate-pulse">
              <Bitcoin className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-balance text-5xl md:text-7xl font-bold mb-6 gradient-text">
            Earn Native Bitcoin Yield
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Deposit STX, receive vSTX, and watch your Bitcoin-backed assets auto-compound with institutional-grade security on Stacks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vault">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 text-lg font-semibold glow-orange hover-lift">
                Start Earning <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/stats">
              <Button size="lg" variant="outline" className="border-border h-14 px-8 text-lg hover-lift">
                View Stats
              </Button>
            </Link>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="mb-24">
          <StatsCards />
        </section>

        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-balance">
            Why Choose Arc Vault?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-8 rounded-2xl hover-lift border-primary/30">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6 glow-orange">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Auto-Compounding</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your yield automatically compounds through our sBTC backing mechanism. Set it and forget it.
              </p>
            </div>
            
            <div className="glass p-8 rounded-2xl hover-lift border-accent/30">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-6 glow-accent">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Bitcoin-Secured</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every vSTX is backed by real Bitcoin through Stacks' sBTC. Maximum security, maximum trust.
              </p>
            </div>
            
            <div className="glass p-8 rounded-2xl hover-lift border-chart-3/30">
              <div className="w-14 h-14 rounded-xl bg-chart-3/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-chart-3" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Transparent Yield</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track every satoshi earned with real-time analytics and on-chain verification.
              </p>
            </div>
          </div>
        </section>

        <section className="glass p-12 rounded-3xl text-center border-primary/30 glow-orange">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Ready to Stack Sats?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the future of Bitcoin DeFi on Stacks. Your journey to passive Bitcoin yield starts here.
          </p>
          <Link href="/vault">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-10 text-lg font-semibold">
              Open Vault <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </section>
      </div>
    </main>
  )
}
