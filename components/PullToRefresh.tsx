'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  disabled?: boolean
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 80, 
  disabled = false 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const container = containerRef.current
    if (!container || container.scrollTop > 0) return
    
    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isPulling) return
    
    const container = containerRef.current
    if (!container || container.scrollTop > 0) return
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY.current)
    
    if (distance > 0) {
      e.preventDefault()
      // Apply resistance curve
      const resistance = Math.min(distance / 2, threshold * 1.5)
      setPullDistance(resistance)
    }
  }, [disabled, isRefreshing, isPulling, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isPulling) return
    
    setIsPulling(false)
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [disabled, isRefreshing, isPulling, pullDistance, threshold, onRefresh])

  const shouldShowIndicator = pullDistance > 10 || isRefreshing
  const isTriggered = pullDistance >= threshold
  const indicatorOpacity = Math.min(pullDistance / threshold, 1)

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull to refresh indicator */}
      {shouldShowIndicator && (
        <div 
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center py-4 bg-white/95 backdrop-blur-sm transition-all duration-200"
          style={{
            transform: `translateY(${Math.max(-60, pullDistance - 60)}px)`,
            opacity: indicatorOpacity
          }}
        >
          <div className={`flex items-center space-x-2 transition-all duration-200 ${
            isTriggered ? 'text-indigo-600' : 'text-gray-400'
          }`}>
            <RefreshCw 
              className={`w-5 h-5 transition-all duration-200 ${
                isRefreshing ? 'animate-spin' : isTriggered ? 'rotate-180' : ''
              }`} 
            />
            <span className="text-sm font-medium">
              {isRefreshing 
                ? 'Refreshing...' 
                : isTriggered 
                  ? 'Release to refresh' 
                  : 'Pull to refresh'
              }
            </span>
          </div>
        </div>
      )}
      
      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
