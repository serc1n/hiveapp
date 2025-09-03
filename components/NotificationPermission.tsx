'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, BellOff, X } from 'lucide-react'

export function NotificationPermission() {
  const { data: session } = useSession()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      checkSubscription()
      
      // Show prompt if not granted and user is logged in
      if (Notification.permission === 'default' && session) {
        setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds
      }
    }
  }, [session])

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Error checking subscription:', error)
      }
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications')
      return
    }

    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        await subscribeToPush()
        setShowPrompt(false)
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('Push messaging is not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      })

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })

      setIsSubscribed(true)
      
      // Show test notification
      new Notification('HiveApp Notifications Enabled!', {
        body: 'You\'ll now receive notifications for announcements',
        icon: '/icon-192x192.png'
      })
    } catch (error) {
      console.error('Error subscribing to push:', error)
    }
  }

  const unsubscribe = async () => {
    if (!('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        // Remove from server
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }
      
      setIsSubscribed(false)
    } catch (error) {
      console.error('Error unsubscribing:', error)
    }
  }

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  if (!session || !('Notification' in window)) return null

  // Notification permission prompt
  if (showPrompt && permission === 'default') {
    return (
      <div className="fixed top-4 left-4 right-4 md:left-auto md:w-80 bg-dark-800 border border-dark-600 rounded-lg p-4 shadow-lg z-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-primary-500 mr-2" />
            <h4 className="font-semibold text-white">Enable Notifications</h4>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-dark-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-sm text-dark-300 mb-4">
          Get notified when group announcements are made, even when the app is closed.
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="flex-1 btn-primary text-sm"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="btn-secondary text-sm"
          >
            Later
          </button>
        </div>
      </div>
    )
  }

  // Notification status indicator (top bar)
  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={permission === 'granted' ? (isSubscribed ? unsubscribe : subscribeToPush) : requestPermission}
        className={`p-2 rounded-lg transition-colors ${
          permission === 'granted' && isSubscribed
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-dark-700 hover:bg-dark-600 text-dark-300'
        }`}
        title={
          permission === 'granted' && isSubscribed
            ? 'Notifications enabled - Click to disable'
            : 'Enable notifications'
        }
      >
        {permission === 'granted' && isSubscribed ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

declare global {
  interface Window {
    Notification: typeof Notification
  }
}
