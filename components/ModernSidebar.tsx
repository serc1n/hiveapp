'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Plus, Hash, Users, User, Lock, Crown } from 'lucide-react'
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
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (session?.user) {
      if (activeTab === 'chats') {
        fetchMyGroups()
      } else if (activeTab === 'explore') {
        fetchExploreGroups()
      }

      // Set up smart polling for updates (no localStorage needed!)
      let pollInterval: NodeJS.Timeout
      let lastCheck = Date.now()
      
      const pollForUpdates = async () => {
        try {
          const response = await fetch(`/api/groups/updates?lastCheck=${lastCheck}`)
          if (response.ok) {
            const data = await response.json()
            if (data.hasUpdates && data.updates.includes('groups')) {
              // Refresh groups if there are updates
              if (activeTab === 'chats') {
                fetchMyGroups()
              } else if (activeTab === 'explore') {
                fetchExploreGroups()
              }
            }
            lastCheck = data.timestamp
          }
        } catch (error) {
          console.error('Error polling for updates:', error)
        }
      }

      // Poll every 15 seconds (much more efficient than localStorage)
      pollInterval = setInterval(pollForUpdates, 15000)

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval)
        }
      }
    }
  }, [session, activeTab])


  const fetchMyGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        const groups = data.groups || []
        setGroups(groups)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }
  

  const fetchExploreGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/groups/browse')
      if (response.ok) {
        const data = await response.json()
        const groups = data.groups || []
        setExploreGroups(groups)
      }
    } catch (error) {
      console.error('Error fetching explore groups:', error)
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


  const handleJoinGroup = async (groupId: string, event: React.MouseEvent) => {
    console.log('🔥 JOIN BUTTON CLICKED:', groupId)
    event.stopPropagation() // Prevent group selection
    
    setJoiningGroups(prev => new Set(Array.from(prev).concat(groupId)))
    console.log('🔄 Setting joining state for:', groupId)
    
    try {
      console.log('📡 Sending join request to:', `/api/groups/${groupId}/join`)
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST'
      })
      
      console.log('📥 Join response status:', response.status)
      
      if (response.ok) {
        console.log('✅ Successfully joined group:', groupId)
        // Refresh explore groups to update join status
        if (activeTab === 'explore') {
          console.log('🔄 Refreshing explore groups...')
          fetchExploreGroups()
        }
        // Also refresh my groups as user now has access
        console.log('🔄 Refreshing my groups...')
        fetchMyGroups()
      } else {
        const error = await response.json()
        console.log('❌ Join failed:', error)
        alert(error.error || 'Failed to join group')
      }
    } catch (error) {
      console.error('💥 Error joining group:', error)
      alert('Failed to join group')
    } finally {
      console.log('🧹 Cleaning up joining state for:', groupId)
      setJoiningGroups(prev => {
        const newArray = Array.from(prev).filter(id => id !== groupId)
        return new Set(newArray)
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
          <h1 className="text-xl font-bold text-gray-900">
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
            
            {/* Profile settings are now handled in ProfileTab component */}
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
                          onClick={(e) => {
                            console.log('🖱️ Join button clicked for group:', group.id, group.name)
                            handleJoinGroup(group.id, e)
                          }}
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
