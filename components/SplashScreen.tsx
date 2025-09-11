'use client'

import { useEffect, useState } from 'react'
import { HiveLogo } from './HiveLogo'

interface SplashScreenProps {
  onComplete?: () => void
  duration?: number
}

export function SplashScreen({ onComplete, duration = 2000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [logoScale, setLogoScale] = useState(0)
  const [textOpacity, setTextOpacity] = useState(0)

  useEffect(() => {
    // Animate logo entrance
    const logoTimer = setTimeout(() => {
      setLogoScale(1)
    }, 100)

    // Animate text entrance
    const textTimer = setTimeout(() => {
      setTextOpacity(1)
    }, 600)

    // Start exit animation
    const exitTimer = setTimeout(() => {
      setIsVisible(false)
    }, duration - 500)

    // Complete callback
    const completeTimer = setTimeout(() => {
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(textTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex flex-col items-center justify-center transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Status Bar Spacer */}
      <div className="h-safe-area-top" />
      
      {/* Logo */}
      <div
        className="mb-8 transition-transform duration-700 ease-out"
        style={{
          transform: `scale(${logoScale}) translateY(${logoScale === 1 ? 0 : 20}px)`
        }}
      >
        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30">
          <HiveLogo className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* App Name */}
      <div
        className="text-center transition-opacity duration-700 delay-300"
        style={{ opacity: textOpacity }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          HiveApp
        </h1>
        <p className="text-white/80 text-lg font-medium">
          Token-Gated Communities
        </p>
      </div>

      {/* Loading Animation */}
      <div
        className="mt-16 transition-opacity duration-700 delay-500"
        style={{ opacity: textOpacity }}
      >
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-0"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>

      {/* Version Info */}
      <div
        className="absolute bottom-8 text-center transition-opacity duration-700 delay-700"
        style={{ opacity: textOpacity * 0.7 }}
      >
        <p className="text-white/60 text-sm">
          v1.0.0 • Built with ❤️
        </p>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-safe-area-bottom" />
    </div>
  )
}
