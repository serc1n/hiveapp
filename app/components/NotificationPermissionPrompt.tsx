"use client"

import { useEffect, useState } from 'react'

export function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission
      setPermission(currentPermission)
      if (currentPermission === 'default') {
        setShowPrompt(true)
      }
    }
  }, [])

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      setShowPrompt(false)
    }
  }

  if (!isClient || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-dark-800 text-white p-4 rounded shadow-lg z-50">
      <p className="mb-2">Enable notifications to stay updated with new messages and announcements.</p>
      <button
        onClick={requestPermission}
        className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded"
      >
        Allow Notifications
      </button>
    </div>
  )
}
