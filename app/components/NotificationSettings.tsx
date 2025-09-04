"use client"

import { useEffect, useState } from 'react'

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      navigator.permissions.query({ name: 'notifications' }).then(permissionStatus => {
        permissionStatus.onchange = () => setPermission(Notification.permission)
      })
    }
  }, [])

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
    }
  }

  if (!isClient) return null

  if (permission === 'granted') {
    return <p>Notifications are enabled.</p>
  }

  if (permission === 'denied') {
    return <p>Notifications are blocked. Please enable them in your browser settings.</p>
  }

  return (
    <div>
      <p>Notifications are not enabled.</p>
      <button onClick={requestPermission} className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded">
        Enable Notifications
      </button>
    </div>
  )
}
