'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ModernSidebar } from './ModernSidebar'
import { ModernChatView } from './ModernChatView'
import { ModernMobileNav } from './ModernMobileNav'
import { ProfileTab } from './ProfileTab'
import { HiveLogo } from './HiveLogo'
import { NotificationPermission } from './NotificationPermission'
import { PWAInstaller } from './PWAInstaller'

export function ModernApp() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'chats' | 'explore' | 'profile'>('chats')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Handle responsive design and localStorage cleanup
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
  }

  const handleBackToList = () => {
    setSelectedGroupId(null)
  }

  const handleGroupDeleted = () => {
    setSelectedGroupId(null)
    setRefreshTrigger(prev => prev + 1) // Trigger sidebar refresh
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-modern p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to HiveApp</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Connect with your community through secure, token-gated conversations
          </p>
          <button 
            onClick={() => window.location.href = '/auth/signin'}
            className="btn-primary w-full"
          >
            Get Started
          </button>
        </div>
        <PWAInstaller />
        <NotificationPermission />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <PWAInstaller />
      <NotificationPermission />
      
      {/* Desktop Layout */}
      {!isMobile && (
        <>
          {/* Sidebar */}
          <div className="w-96 bg-white border-r border-gray-200 flex-shrink-0">
            <ModernSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedGroupId={selectedGroupId}
              onSelectGroup={handleSelectGroup}
              refreshTrigger={refreshTrigger}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {selectedGroupId ? (
              <ModernChatView 
                groupId={selectedGroupId} 
                onBack={handleBackToList}
                onGroupDeleted={handleGroupDeleted}
              />
            ) : activeTab === 'profile' ? (
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <ProfileTab />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <HiveLogo className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Select a Hive</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Choose from your existing Hives or start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Mobile Layout */}
      {isMobile && (
        <div className="flex-1 flex flex-col mobile-full">
          {selectedGroupId ? (
            <ModernChatView 
              groupId={selectedGroupId} 
              onBack={handleBackToList}
              isMobile={true}
              onGroupDeleted={handleGroupDeleted}
            />
          ) : activeTab === 'profile' ? (
            <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
              <ProfileTab />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
            <ModernSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedGroupId={selectedGroupId}
              onSelectGroup={handleSelectGroup}
              isMobile={true}
              refreshTrigger={refreshTrigger}
            />
            </div>
          )}
          {!selectedGroupId && (
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <ModernMobileNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
