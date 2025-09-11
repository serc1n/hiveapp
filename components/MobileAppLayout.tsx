'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AppBottomNavigation } from './AppBottomNavigation'
import { MobileHiveList } from './MobileHiveList'
import { MobileExploreView } from './MobileExploreView'
import { ModernChatView } from './ModernChatView'
import { ProfileTab } from './ProfileTab'
import { MobileCreateHiveModal } from './MobileCreateHiveModal'
import { HiveLogo } from './HiveLogo'

export function MobileAppLayout() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'chats' | 'explore' | 'profile'>('chats')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId || null)
  }

  const handleBackToList = () => {
    setSelectedGroupId(null)
  }

  const handleGroupDeleted = () => {
    setSelectedGroupId(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleNavigateToMyHives = () => {
    setSelectedGroupId(null)
    setActiveTab('chats')
  }

  const handleCreateHive = () => {
    setShowCreateModal(true)
  }

  // If a group is selected, show the chat view
  if (selectedGroupId) {
    return (
      <div className="h-screen bg-white flex flex-col">
        <ModernChatView 
          groupId={selectedGroupId} 
          onBack={handleBackToList}
          isMobile={true}
          onGroupDeleted={handleGroupDeleted}
          onNavigateToMyHives={handleNavigateToMyHives}
        />
      </div>
    )
  }

  // Main app view with tabs
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Status Bar Spacer */}
      <div className="h-safe-area-top bg-white"></div>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <HiveLogo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'chats' ? 'Hives' : activeTab === 'explore' ? 'Explore' : 'Profile'}
              </h1>
              <p className="text-sm text-gray-500">
                {activeTab === 'chats' ? 'Your conversations' : activeTab === 'explore' ? 'Discover new hives' : 'Manage your account'}
              </p>
            </div>
          </div>
          
          {/* Optional header actions */}
          {session?.user?.image && (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={session.user.image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden pb-20">
        {activeTab === 'chats' && (
          <MobileHiveList
            selectedGroupId={selectedGroupId}
            onSelectGroup={handleSelectGroup}
            refreshTrigger={refreshTrigger}
          />
        )}
        
        {activeTab === 'explore' && (
          <MobileExploreView
            onSelectGroup={handleSelectGroup}
          />
        )}
        
        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto">
            <ProfileTab />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <AppBottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateHive={handleCreateHive}
      />

      {/* Create Hive Modal */}
      {showCreateModal && (
        <MobileCreateHiveModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={() => {
            setShowCreateModal(false)
            setRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}
