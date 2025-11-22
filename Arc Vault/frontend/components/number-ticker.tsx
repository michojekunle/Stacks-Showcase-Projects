'use client'

import { useEffect, useState } from 'react'

interface NumberTickerProps {
  value: number
  decimals?: number
}

export function NumberTicker({ value, decimals = 0 }: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const increment = value / 60
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return <>{displayValue.toLocaleString('en-US', { maximumFractionDigits: decimals })}</>
}
