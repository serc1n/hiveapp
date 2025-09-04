'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, Wallet, LogOut } from 'lucide-react'
import { ChatArea } from './ChatArea'
import { MyHivesTab } from './MyHivesTab'
import { BrowseHivesTab } from './BrowseHivesTab'
import { ProfileTab } from './ProfileTab'
import { BottomNavigation } from './BottomNavigation'
import { WalletConnection } from './WalletConnection'
import { UserProfile } from './UserProfile'
import { PWAInstaller } from './PWAInstaller'
import { NotificationPermission } from './NotificationPermission'

export function MainApp() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'my-hives' | 'explore' | 'profile'>('my-hives')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Handle URL parameters for direct group navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const groupIdFromUrl = urlParams.get('groupId')
      if (groupIdFromUrl && !selectedGroupId) {
        setSelectedGroupId(groupIdFromUrl)
        // Clear the URL parameter
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
    setActiveTab('my-hives') // Switch to My Hives when selecting a group
  }

  const handleBackToList = () => {
    setSelectedGroupId(null)
  }

  return (
    <div className="h-screen bg-black flex geometric-bg">
      <PWAInstaller />
      <NotificationPermission />
      
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-800 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-800 bg-black">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Hives</h1>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowProfile(true)}
                  className="p-2 hover:bg-gray-900 rounded-full transition-colors"
                  title="Profile"
                >
                  <User className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="p-2 hover:bg-gray-900 rounded-full transition-colors"
                  title="Connect Wallet"
                >
                  <Wallet className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => signOut()}
                  className="p-2 hover:bg-gray-900 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            {/* Desktop Tab Navigation */}
            <div className="flex bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('my-hives')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'my-hives'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                My Hives
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'explore'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Explore
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Profile
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'my-hives' ? (
              <MyHivesTab
                selectedGroupId={selectedGroupId}
                onSelectGroup={handleSelectGroup}
              />
            ) : activeTab === 'explore' ? (
              <BrowseHivesTab
                onSelectGroup={handleSelectGroup}
              />
            ) : (
              <ProfileTab />
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedGroupId ? (
            <ChatArea groupId={selectedGroupId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Select a message</h2>
                <p className="text-gray-400 max-w-sm">
                  Choose from your existing conversations, start a new one, or just keep swimming.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col w-full" style={{ height: '100dvh' }}>
        {selectedGroupId ? (
          // Mobile Chat View - Full screen
          <ChatArea groupId={selectedGroupId} onBack={handleBackToList} />
        ) : (
          // Mobile Tab Views with fixed bottom nav
          <>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'my-hives' ? (
                <MyHivesTab
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={handleSelectGroup}
                />
              ) : activeTab === 'explore' ? (
                <BrowseHivesTab
                  onSelectGroup={handleSelectGroup}
                />
              ) : (
                <ProfileTab />
              )}
            </div>

            <div className="flex-shrink-0">
              <BottomNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showWalletModal && (
        <WalletConnection onClose={() => setShowWalletModal(false)} />
      )}

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
    </div>
  )
}
