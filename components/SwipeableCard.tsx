'use client'

import { useState, useRef, ReactNode } from 'react'

interface SwipeAction {
  icon: ReactNode
  color: string
  action: () => void
  threshold?: number
}

interface SwipeableCardProps {
  children: ReactNode
  leftAction?: SwipeAction
  rightAction?: SwipeAction
  disabled?: boolean
}

export function SwipeableCard({ 
  children, 
  leftAction, 
  rightAction, 
  disabled = false 
}: SwipeableCardProps) {
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isSwiping) return
    
    const currentX = e.touches[0].clientX
    const distance = currentX - startX.current
    
    // Only allow swipe if there's an action for that direction
    if ((distance > 0 && !leftAction) || (distance < 0 && !rightAction)) {
      return
    }
    
    // Apply resistance curve
    const maxDistance = 120
    const resistance = distance > 0 
      ? Math.min(distance * 0.7, maxDistance)
      : Math.max(distance * 0.7, -maxDistance)
    
    setSwipeDistance(resistance)
  }

  const handleTouchEnd = () => {
    if (disabled || !isSwiping) return
    
    setIsSwiping(false)
    
    const threshold = 60
    
    if (swipeDistance > threshold && leftAction) {
      leftAction.action()
    } else if (swipeDistance < -threshold && rightAction) {
      rightAction.action()
    }
    
    setSwipeDistance(0)
  }

  const getBackgroundColor = () => {
    if (Math.abs(swipeDistance) < 20) return 'transparent'
    
    if (swipeDistance > 0 && leftAction) {
      return leftAction.color
    } else if (swipeDistance < 0 && rightAction) {
      return rightAction.color
    }
    
    return 'transparent'
  }

  const getActionIcon = () => {
    const threshold = 60
    
    if (swipeDistance > threshold && leftAction) {
      return leftAction.icon
    } else if (swipeDistance < -threshold && rightAction) {
      return rightAction.icon
    }
    
    return null
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background action */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-all duration-200"
        style={{
          backgroundColor: getBackgroundColor(),
          opacity: Math.min(Math.abs(swipeDistance) / 60, 1)
        }}
      >
        {getActionIcon() && (
          <div className="text-white">
            {getActionIcon()}
          </div>
        )}
      </div>
      
      {/* Card content */}
      <div
        ref={cardRef}
        className="relative bg-white transition-transform duration-200"
        style={{
          transform: `translateX(${swipeDistance}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
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
