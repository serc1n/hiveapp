'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'
import { WalletConnection } from './WalletConnection'
import { PWAInstaller } from './PWAInstaller'
import { NotificationPermission } from './NotificationPermission'

export function MainApp() {
  const { data: session } = useSession()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  return (
    <div className="h-screen bg-dark-900 flex">
      <PWAInstaller />
      <NotificationPermission />
      
      {/* Sidebar */}
      <div className="w-80 border-r border-dark-700 flex flex-col">
        <Sidebar 
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          onShowWalletModal={() => setShowWalletModal(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedGroupId ? (
          <ChatArea groupId={selectedGroupId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                💬
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Welcome to HiveApp
              </h3>
              <p className="text-dark-400">
                Select a group to start chatting or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <WalletConnection onClose={() => setShowWalletModal(false)} />
      )}
    </div>
  )
}
