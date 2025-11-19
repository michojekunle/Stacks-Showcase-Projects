'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpRight, ArrowDownLeft, Zap, TrendingUp } from 'lucide-react'
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
    <Card className="glass border-primary/30 p-8 hover-lift">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">Your Vault Balance</h2>
          <div className="space-y-6">
            <div className="glass p-6 rounded-xl border-primary/20 hover-lift">
              <p className="text-sm text-muted-foreground mb-2">vSTX Balance</p>
              <p className="text-4xl font-bold text-foreground">{vstxBalance.toLocaleString()}</p>
            </div>
            <div className="glass p-6 rounded-xl border-border hover-lift">
              <p className="text-sm text-muted-foreground mb-2">Equivalent STX Value</p>
              <div className="flex items-baseline gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  {stxEquivalent.toLocaleString('en-US', { maximumFractionDigits: 2 })} STX
                </p>
              </div>
            </div>
            <div className="glass p-6 rounded-xl border-primary/30 glow-orange hover-lift">
              <p className="text-sm text-muted-foreground mb-2">Unrealized Yield</p>
              <div className="flex items-baseline gap-2">
                <Zap className="w-6 h-6 text-primary animate-pulse" />
                <p className="text-3xl font-bold text-primary">
                  +{unrealizedYield.toLocaleString('en-US', { maximumFractionDigits: 2 })} STX
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'deposit' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('deposit')
                setInputValue('')
              }}
              className={`flex-1 h-12 transition-all ${
                activeTab === 'deposit' 
                  ? 'bg-primary text-primary-foreground glow-orange scale-105' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <ArrowUpRight className="w-5 h-5 mr-2" />
              DEPOSIT
            </Button>
            <Button
              variant={activeTab === 'withdraw' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('withdraw')
                setInputValue('')
              }}
              className={`flex-1 h-12 transition-all ${
                activeTab === 'withdraw' 
                  ? 'bg-primary text-primary-foreground glow-orange scale-105' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <ArrowDownLeft className="w-5 h-5 mr-2" />
              WITHDRAW
            </Button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-3 block uppercase tracking-wider text-muted-foreground">
                {activeTab === 'deposit' ? 'STX Amount' : 'vSTX Amount'}
              </label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={!account || isLoading}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground h-14 text-lg font-medium"
                />
                <Button
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/10 h-14 px-6 font-semibold hover-lift"
                  onClick={() => setInputValue(activeTab === 'deposit' ? '1000' : vstxBalance.toString())}
                  disabled={!account}
                >
                  MAX
                </Button>
              </div>
            </div>

            <div className="glass p-6 rounded-xl border-border animate-in fade-in">
              <p className="text-sm text-muted-foreground mb-3">
                {activeTab === 'deposit' ? 'You will receive' : 'You will get'}
              </p>
              <p className="text-3xl font-bold text-primary">
                {previewAmount} {activeTab === 'deposit' ? 'vSTX' : 'STX'}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Share price: 4.85 STX per vSTX
              </p>
            </div>

            <Button
              onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
              disabled={!inputValue || isLoading || !account || isConnecting}
              className="w-full h-14 text-base font-semibold hover-lift transition-all bg-primary hover:bg-primary/90 text-primary-foreground glow-orange"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
