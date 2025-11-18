'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bitcoin } from 'lucide-react'
import { useStacksWallet } from '@/hooks/use-stacks-wallet'

export function Header() {
  const { account, isConnecting, connectLeather, connectXverse, disconnect, providers } = useStacksWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)

  const handleConnect = (walletType: 'leather' | 'xverse') => {
    if (walletType === 'leather') {
      connectLeather()
    } else {
      connectXverse()
    }
    setShowWalletModal(false)
  }

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="glass border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Bitcoin className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Arc Vault</span>
          </div>

          {/* Connection Button */}
          {account ? (
            <div className="flex items-center gap-3">
              <div className="glass px-4 py-2 rounded-lg border border-primary/30 text-sm font-medium">
                {truncateAddress(account.address)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="border-border/50 hover:bg-secondary/50"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setShowWalletModal(!showWalletModal)}
              disabled={isConnecting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>

        {/* Wallet Modal */}
        {showWalletModal && !account && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {providers.map((provider) => (
              <Button
                key={provider.name}
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
                onClick={() => handleConnect(provider.name)}
                disabled={isConnecting}
              >
                {provider.name === 'leather' ? 'Connect Leather' : 'Connect Xverse'}
              </Button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
