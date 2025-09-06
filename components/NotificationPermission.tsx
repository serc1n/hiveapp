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
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BF1e3Ti7SKuuDlFZa3AX2fqfgXzW0jagGMXkwGr5vwklnonuqygCqXvmCqNQOCFQPlatQ-39F7jYi_aWiSSZmP4'
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 max-w-sm w-full mx-4 animate-slide-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Updated</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Get notified instantly when group announcements are made, even when the app is closed.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Enabling...
                </div>
              ) : (
                'Allow Notifications'
              )}
            </button>
            
            <button
              onClick={() => setShowPrompt(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-2xl transition-all duration-200"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No status indicator needed - only show the main permission prompt
  return null
}

declare global {
  interface Window {
    Notification: typeof Notification
  }
}
