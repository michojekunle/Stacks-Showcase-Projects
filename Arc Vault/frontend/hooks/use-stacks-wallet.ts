'use client'

import { useEffect, useState, useCallback } from 'react'

export interface StacksAccount {
  address: string
  balance: string
  stxBalance: string
}

interface WalletProvider {
  name: 'leather' | 'xverse'
  isInstalled: boolean
}

export function useStacksWallet() {
  const [account, setAccount] = useState<StacksAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providers, setProviders] = useState<WalletProvider[]>([])

  // Check for available wallet providers
  useEffect(() => {
    const checkProviders = () => {
      const available: WalletProvider[] = []
      
      // Check for Leather wallet
      if ((window as any).LeatherProvider) {
        available.push({ name: 'leather', isInstalled: true })
      }
      
      // Check for Xverse wallet
      if ((window as any).XverseProviders) {
        available.push({ name: 'xverse', isInstalled: true })
      }
      
      setProviders(available)
    }

    checkProviders()
    window.addEventListener('load', checkProviders)
    return () => window.removeEventListener('load', checkProviders)
  }, [])

  const connectLeather = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const provider = (window as any).LeatherProvider
      if (!provider) {
        throw new Error('Leather wallet not installed')
      }

      // Request wallet connection
      const response = await provider.requestPermissions({
        permissions: ['store_write', 'store_read'],
      })

      if (response.permissions.includes('store_read')) {
        // Get user account info
        const accountInfo = await provider.getAddresses()
        const stxAddress = accountInfo.addresses[0]?.address

        if (stxAddress) {
          // Fetch STX balance (mock for now - replace with actual API call)
          const mockBalance = '1000000000' // 1000 STX in microSTX
          
          setAccount({
            address: stxAddress,
            balance: mockBalance,
            stxBalance: (parseInt(mockBalance) / 1000000).toString(),
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Leather')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const connectXverse = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const xverse = (window as any).XverseProviders?.XverseProvider

      if (!xverse) {
        throw new Error('Xverse wallet not installed')
      }

      // Request STX account
      const response = await xverse.request('getAccounts', {
        types: ['stacks'],
      })

      const stxAccount = response.stacks[0]

      if (stxAccount?.address) {
        // Mock balance - replace with actual API call
        const mockBalance = '1000000000'
        
        setAccount({
          address: stxAccount.address,
          balance: mockBalance,
          stxBalance: (parseInt(mockBalance) / 1000000).toString(),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Xverse')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setError(null)
  }, [])

  return {
    account,
    isConnecting,
    error,
    providers,
    connectLeather,
    connectXverse,
    disconnect,
    isConnected: !!account,
  }
}
