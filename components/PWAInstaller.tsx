'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-dark-800 border border-dark-600 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <Download className="w-5 h-5 text-primary-500 mr-2" />
          <h4 className="font-semibold text-white">Install HiveApp</h4>
        </div>
        <button
          onClick={() => setShowInstallPrompt(false)}
          className="text-dark-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-dark-300 mb-3">
        Add HiveApp to your home screen for quick access and notifications
      </p>
      <div className="flex space-x-2">
        <button
          onClick={handleInstall}
          className="btn-primary text-sm flex-1"
        >
          Install
        </button>
        <button
          onClick={() => setShowInstallPrompt(false)}
          className="btn-secondary text-sm"
        >
          Later
        </button>
      </div>
    </div>
  )
}
