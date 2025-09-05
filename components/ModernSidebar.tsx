'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Plus, Hash, Users, Settings, Bell, BellOff, User, Lock, Crown } from 'lucide-react'
import Image from 'next/image'
import { CreateGroupModal } from './CreateGroupModal'
import { HiveLogo } from './HiveLogo'

interface Group {
  id: string
  name: string
  profileImage: string | null
  memberCount: number
  contractAddress: string | null
  isCreator?: boolean
  lastMessage?: {
    content: string
    createdAt: string
    user: {
      name: string
    }
  } | null
  updatedAt: string
  hasAccess: boolean
}

interface ModernSidebarProps {
  activeTab: 'chats' | 'explore' | 'profile'
  onTabChange: (tab: 'chats' | 'explore' | 'profile') => void
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
  isMobile?: boolean
}

export function ModernSidebar({ 
  activeTab, 
  onTabChange, 
  selectedGroupId, 
  onSelectGroup,
  isMobile = false 
}: ModernSidebarProps) {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [exploreGroups, setExploreGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (session?.user) {
      if (activeTab === 'chats') {
        fetchMyGroups()
      } else if (activeTab === 'explore') {
        fetchExploreGroups()
      }
    }
  }, [session, activeTab])

  useEffect(() => {
    // Check notification permission and subscription status
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission)
      }
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

  const fetchMyGroups = async () => {
    try {
      setLoading(true)
      
      // Try to load from cache first
      const cacheKey = `myGroups_${session?.user?.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const cachedData = JSON.parse(cached)
          if (Date.now() - cachedData.timestamp < 30000) { // 30 seconds cache
            setGroups(cachedData.groups)
            setLoading(false)
            // Still fetch in background for updates
            fetchMyGroupsFromAPI(cacheKey)
            return
          }
        } catch (e) {
          // Invalid cache, continue with API call
        }
      }
      
      await fetchMyGroupsFromAPI(cacheKey)
    } catch (error) {
      console.error('Error fetching groups:', error)
      setLoading(false)
    }
  }
  
  const fetchMyGroupsFromAPI = async (cacheKey: string) => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        const groups = data.groups || []
        setGroups(groups)
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          groups,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error fetching groups from API:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExploreGroups = async () => {
    try {
      setLoading(true)
      
      // Try to load from cache first
      const cacheKey = `exploreGroups_${session?.user?.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const cachedData = JSON.parse(cached)
          if (Date.now() - cachedData.timestamp < 60000) { // 60 seconds cache for explore
            setExploreGroups(cachedData.groups)
            setLoading(false)
            // Still fetch in background for updates
            fetchExploreGroupsFromAPI(cacheKey)
            return
          }
        } catch (e) {
          // Invalid cache, continue with API call
        }
      }
      
      await fetchExploreGroupsFromAPI(cacheKey)
    } catch (error) {
      console.error('Error fetching explore groups:', error)
      setLoading(false)
    }
  }
  
  const fetchExploreGroupsFromAPI = async (cacheKey: string) => {
    try {
      const response = await fetch('/api/groups/browse')
      if (response.ok) {
        const data = await response.json()
        const groups = data.groups || []
        setExploreGroups(groups)
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          groups,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error fetching explore groups from API:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
        alert('Error disabling notifications. Please try again.')
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
          } else {
            alert('Notifications are not configured for this app.')
          }
        }
      } catch (error) {
        console.error('Error enabling notifications:', error)
        alert('Error enabling notifications. Please try again.')
      }
    }
  }

  const handleJoinGroup = async (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent group selection
    
    setJoiningGroups(prev => new Set([...prev, groupId]))
    
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Refresh explore groups to update join status
        if (activeTab === 'explore') {
          fetchExploreGroups()
        }
        // Also refresh my groups as user now has access
        fetchMyGroups()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join group')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group')
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
    }
  }

  const filteredGroups = (activeTab === 'chats' ? groups : exploreGroups).filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'chats' ? 'Hives' : activeTab === 'explore' ? 'Explore' : 'Profile'}
          </h1>
          {activeTab === 'chats' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-card hover:shadow-modern transition-all duration-200"
              title="Create new chat"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        
        {/* Navigation Tabs - Desktop only */}
        {!isMobile && (
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            {[
              { id: 'chats', label: 'My Hives', icon: Hash, useCustomIcon: true },
              { id: 'explore', label: 'Explore', icon: Users },
              { id: 'profile', label: 'Profile', icon: User }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-card'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.useCustomIcon && tab.id === 'chats' ? (
                    <HiveLogo className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        )}
        
        {/* Search */}
        {(activeTab === 'chats' || activeTab === 'explore') && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20' : ''}`}>
        {activeTab === 'profile' ? (
          <div className="p-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {session?.user?.name || 'User'}
              </h3>
              <p className="text-gray-600">@{session?.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  // For now, switch to the profile tab which has the actual settings
                  onTabChange('profile');
                }}
                className="w-full flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900 font-medium">Settings</span>
              </button>
              <button 
                onClick={handleToggleNotifications}
                className={`w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-100 transition-colors ${
                  notificationPermission === 'granted' && isSubscribed 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {notificationPermission === 'granted' && isSubscribed ? (
                    <Bell className="w-5 h-5 text-green-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-600" />
                  )}
                  <span className={`font-medium ${
                    notificationPermission === 'granted' && isSubscribed 
                      ? 'text-green-900' 
                      : 'text-gray-900'
                  }`}>
                    Notifications
                  </span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  notificationPermission === 'granted' && isSubscribed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {notificationPermission === 'granted' && isSubscribed ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Hash className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'chats' ? 'No conversations yet' : 'No groups to explore'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'chats' 
                ? 'Start your first conversation by creating a group'
                : 'All available groups have been joined'
              }
            </p>
            {activeTab === 'chats' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Group
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedGroupId === group.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                }`}
                disabled={!group.hasAccess}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                    {group.profileImage ? (
                      <img
                        src={group.profileImage}
                        alt={group.name}
                        className="w-12 h-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <Hash className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {group.name}
                        </h3>
                        {group.contractAddress && (
                          <div title="Token-gated">
                            <Lock className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                          </div>
                        )}
                        {group.isCreator && (
                          <div title="You own this group">
                            <Crown className="w-3 h-3 text-purple-600 flex-shrink-0" />
                          </div>
                        )}
                      </div>
                      {activeTab === 'explore' && !group.hasAccess ? (
                        <button
                          onClick={(e) => handleJoinGroup(group.id, e)}
                          disabled={joiningGroups.has(group.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs rounded-lg font-medium transition-colors flex-shrink-0"
                        >
                          {joiningGroups.has(group.id) ? 'Joining...' : 'Join'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {group.lastMessage 
                            ? formatTime(group.lastMessage.createdAt)
                            : formatTime(group.updatedAt)
                          }
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs truncate">
                      {group.lastMessage 
                        ? `${group.lastMessage.user.name}: ${group.lastMessage.content}`
                        : `${group.memberCount} member${group.memberCount !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={() => {
            setShowCreateModal(false)
            fetchMyGroups()
          }}
        />
      )}
    </div>
  )
}
