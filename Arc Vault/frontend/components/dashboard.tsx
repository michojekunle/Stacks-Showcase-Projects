'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useStacksWallet } from '@/hooks/use-stacks-wallet'
import { depositSTX, withdrawVSTX } from '@/lib/stacks-contracts'

export function Dashboard() {
  const { account, isConnecting } = useStacksWallet()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const vstxBalance = 2500
  const stxEquivalent = vstxBalance * 4.85
  const unrealizedYield = stxEquivalent * 0.12

  const handleDeposit = async () => {
    if (!account) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      })
      return
    }

    if (!inputValue) return

    setIsLoading(true)
    toast({
      title: 'Deposit Pending',
      description: 'Processing your STX deposit...',
    })

    try {
      const amountInMicroSTX = (parseFloat(inputValue) * 1000000).toString()
      const result = await depositSTX(account, amountInMicroSTX, account.address)
      
      console.log(`[v0] Deposit successful: ${result.txId}`)
      
      setTimeout(() => {
        setIsLoading(false)
        setInputValue('')
        toast({
          title: 'Deposit Successful',
          description: `Deposited ${inputValue} STX and received ${(parseFloat(inputValue) / 4.85).toFixed(2)} vSTX\nTx: ${result.txId.slice(0, 8)}...`,
        })
      }, 2000)
    } catch (error) {
      setIsLoading(false)
      toast({
        title: 'Deposit Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleWithdraw = async () => {
    if (!account) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      })
      return
    }

    if (!inputValue) return

    setIsLoading(true)
    toast({
      title: 'Withdrawal Pending',
      description: 'Processing your vSTX withdrawal...',
    })

    try {
      const amountInMicroVSTX = (parseFloat(inputValue) * 1000000).toString()
      const result = await withdrawVSTX(account, amountInMicroVSTX, account.address)
      
      console.log(`[v0] Withdrawal successful: ${result.txId}`)
      
      setTimeout(() => {
        setIsLoading(false)
        setInputValue('')
        toast({
          title: 'Withdrawal Successful',
          description: `Burned ${inputValue} vSTX and received ${(parseFloat(inputValue) * 4.85).toFixed(2)} STX\nTx: ${result.txId.slice(0, 8)}...`,
        })
      }, 2000)
    } catch (error) {
      setIsLoading(false)
      toast({
        title: 'Withdrawal Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const previewAmount = inputValue 
    ? activeTab === 'deposit' 
      ? (parseFloat(inputValue) / 4.85).toFixed(4)
      : (parseFloat(inputValue) * 4.85).toFixed(4)
    : '0'

  return (
    <Card className="glass border-primary/20 p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Balance Info */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-6">YOUR VAULT BALANCE</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">vSTX Balance</p>
              <p className="text-4xl font-bold">{vstxBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Equivalent STX Value</p>
              <p className="text-3xl font-bold text-primary">
                {stxEquivalent.toLocaleString('en-US', { maximumFractionDigits: 2 })} STX
              </p>
            </div>
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Unrealized Yield</p>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary glow-orange" />
                <p className="text-2xl font-bold text-primary">
                  +{unrealizedYield.toLocaleString('en-US', { maximumFractionDigits: 2 })} STX
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Interface */}
        <div>
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'deposit' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('deposit')
                setInputValue('')
              }}
              className={activeTab === 'deposit' ? 'bg-primary text-primary-foreground' : 'border-primary/30'}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              DEPOSIT
            </Button>
            <Button
              variant={activeTab === 'withdraw' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('withdraw')
                setInputValue('')
              }}
              className={activeTab === 'withdraw' ? 'bg-primary text-primary-foreground' : 'border-primary/30'}
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              WITHDRAW
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {activeTab === 'deposit' ? 'STX Amount' : 'vSTX Amount'}
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={!account || isLoading}
                  className="bg-input border-border/50 text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  variant="outline"
                  className="border-primary/30"
                  onClick={() => setInputValue(activeTab === 'deposit' ? '1000' : vstxBalance.toString())}
                  disabled={!account}
                >
                  MAX
                </Button>
              </div>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                {activeTab === 'deposit' ? 'You will receive' : 'You will get'}
              </p>
              <p className="text-2xl font-bold">
                {previewAmount} {activeTab === 'deposit' ? 'vSTX' : 'STX'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Share price: 4.85 STX per vSTX
              </p>
            </div>

            <Button
              onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
              disabled={!inputValue || isLoading || !account || isConnecting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : !account ? (
                'Connect Wallet to Start'
              ) : (
                activeTab === 'deposit' ? 'Deposit STX' : 'Withdraw vSTX'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
