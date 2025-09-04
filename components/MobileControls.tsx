'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Bell, BellOff } from 'lucide-react'

export function AppSettings() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check notification permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission)
      }

      // Get service worker registration
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          setRegistration(reg)
        })
      }

      // Check if subscribed to push notifications
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Error checking subscription:', error)
      }
    }
  }

  const handleCheckUpdate = async () => {
    if (!registration) return
    
    setIsCheckingUpdate(true)
    try {
      await registration.update()
      // Give it a moment to check
      setTimeout(() => {
        setIsCheckingUpdate(false)
        // Show feedback to user
        alert('Checked for updates! You have the latest version.')
      }, 2000)
    } catch (error) {
      console.error('Error checking for updates:', error)
      setIsCheckingUpdate(false)
      alert('Error checking for updates. Please try again.')
    }
  }

  const handleToggleNotifications = async () => {
    if (notificationPermission === 'granted' && isSubscribed) {
      // Unsubscribe
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          setIsSubscribed(false)
        }
      } catch (error) {
        console.error('Error unsubscribing:', error)
      }
    } else {
      // Subscribe
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          
          if (vapidPublicKey) {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidPublicKey
            })

            // Save subscription to server
            await fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription)
            })

            setIsSubscribed(true)
          }
        }
      } catch (error) {
        console.error('Error enabling notifications:', error)
        alert('Error enabling notifications. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* App Settings Section */}
      <div className="bg-dark-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2" />
          App Settings
        </h3>
        
        <div className="space-y-3">
          {/* Check Update Button */}
          <button
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate || !registration}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            {isCheckingUpdate ? 'Checking for Updates...' : 'Check for Updates'}
          </button>

          {/* Notification Toggle Button */}
          <button
            onClick={handleToggleNotifications}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
              notificationPermission === 'granted' && isSubscribed
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {notificationPermission === 'granted' && isSubscribed ? (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Notifications Enabled
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                Enable Notifications
              </>
            )}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-400">
          <p>• Check for app updates manually</p>
          <p>• Manage push notification preferences</p>
        </div>
      </div>
    </div>
  )
}
