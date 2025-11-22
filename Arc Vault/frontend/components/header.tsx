'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bitcoin, Menu, X } from 'lucide-react'
import { useStacksWallet } from '@/hooks/use-stacks-wallet'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const { account, isConnecting, connect, disconnect, hasLeather, hasXverse } = useStacksWallet()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/vault', label: 'Vault' },
    { href: '/stats', label: 'Stats' },
    { href: '/admin', label: 'Admin' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  return (
    <header className="glass border-b border-border sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover-lift">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center glow-orange">
              <Bitcoin className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Arc Vault</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={`${
                    isActive(link.href)
                      ? 'bg-primary/20 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  } transition-all`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {account ? (
              <>
                <div className="glass px-4 py-2 rounded-lg border border-primary/50 text-sm font-mono glow-orange">
                  {truncateAddress(account.address)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="border-border hover:bg-secondary/50"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button 
                onClick={connect}
                disabled={isConnecting || (!hasLeather && !hasXverse)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground glow-orange hover-lift"
              >
                {isConnecting ? 'Connecting...' : (!hasLeather && !hasXverse) ? 'No Wallet Found' : 'Connect Wallet'}
              </Button>
            )}
          </div>

          <button
            className="md:hidden p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-3 animate-in slide-in-from-top">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      isActive(link.href)
                        ? 'bg-primary/20 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>
            
            <div className="pt-3 border-t border-border">
              {account ? (
                <div className="space-y-2">
                  <div className="glass px-4 py-2 rounded-lg border border-primary/50 text-sm font-mono text-center">
                    {truncateAddress(account.address)}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-border hover:bg-secondary/50"
                    onClick={disconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => {
                    connect()
                    setMobileMenuOpen(false)
                  }}
                  disabled={isConnecting || (!hasLeather && !hasXverse)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isConnecting ? 'Connecting...' : (!hasLeather && !hasXverse) ? 'No Wallet Found' : 'Connect Wallet'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
