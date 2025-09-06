'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, X } from 'lucide-react'

interface NativeNotificationProps {
  message: string
  type: 'success' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function NativeNotification({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 3000 
}: NativeNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 300) // Wait for fade out animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible && !isAnimating) return null

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-blue-500'
  const icon = type === 'success' ? CheckCircle : Clock

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div 
        className={`
          ${bgColor} text-white rounded-2xl shadow-2xl px-6 py-4 max-w-sm w-full
          transform transition-all duration-300 ease-out pointer-events-auto
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="flex items-center space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {React.createElement(icon, { 
              className: "w-6 h-6 text-white" 
            })}
          </div>
          
          {/* Message */}
          <div className="flex-1">
            <p className="text-white font-medium text-center">
              {message}
            </p>
          </div>
          
          {/* Close button */}
          <button
            onClick={() => {
              setIsAnimating(false)
              setTimeout(onClose, 300)
            }}
            className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing notifications
export function useNativeNotification() {
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'info'
    isVisible: boolean
  } | null>(null)

  const showSuccess = (message: string) => {
    setNotification({
      message,
      type: 'success',
      isVisible: true
    })
  }

  const showInfo = (message: string) => {
    setNotification({
      message,
      type: 'info',
      isVisible: true
    })
  }

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, isVisible: false } : null)
  }

  return {
    notification,
    showSuccess,
    showInfo,
    hideNotification
  }
}
