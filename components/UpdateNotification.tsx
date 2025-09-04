'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

export function UpdateNotification() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                setShowUpdatePrompt(true)
              }
            })
          }
        })
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setShowUpdatePrompt(true)
        }
      })

      // Check for updates periodically (every 5 minutes)
      const checkForUpdates = () => {
        if (registration) {
          registration.update()
        }
      }

      // Initial check
      setTimeout(checkForUpdates, 5000) // Check after 5 seconds
      
      // Periodic checks
      const updateInterval = setInterval(checkForUpdates, 5 * 60 * 1000) // Every 5 minutes

      return () => {
        clearInterval(updateInterval)
      }
    }
  }, [registration])

  const handleUpdate = () => {
    setIsUpdating(true)
    
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      registration.waiting.addEventListener('statechange', (e) => {
        const target = e.target as ServiceWorker
        if (target.state === 'activated') {
          // Small delay to ensure service worker is fully activated
          setTimeout(() => {
            window.location.reload()
          }, 500)
        }
      })
    } else {
      // Force a hard reload to get the latest version
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  if (!showUpdatePrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-900 border border-blue-700 rounded-lg p-4 shadow-xl z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <RefreshCw className={`w-5 h-5 text-blue-400 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          <h4 className="font-semibold text-white">
            {isUpdating ? 'Updating...' : 'Update Available'}
          </h4>
        </div>
        {!isUpdating && (
          <button 
            onClick={() => setShowUpdatePrompt(false)}
            className="text-blue-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <p className="text-sm text-blue-200 mb-4">
        {isUpdating 
          ? 'Please wait while we update HiveApp to the latest version...'
          : 'A new version of HiveApp is available with the latest features and improvements.'
        }
      </p>
      
      {!isUpdating && (
        <div className="flex space-x-2">
          <button 
            onClick={handleUpdate}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Now
          </button>
          <button 
            onClick={() => setShowUpdatePrompt(false)}
            className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-blue-200 rounded-lg font-medium text-sm transition-colors"
          >
            Later
          </button>
        </div>
      )}
      
      {isUpdating && (
        <div className="flex justify-center">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}
