'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Hash, Users, Lock, Crown, ChevronRight, MessageCircle, Archive, Settings } from 'lucide-react'
import { useSocket } from '../lib/socketContext'
import { NativeNotification, useNativeNotification } from './NativeNotification'
import { PullToRefresh } from './PullToRefresh'
import { SwipeableCard } from './SwipeableCard'

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

interface MobileHiveListProps {
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
  refreshTrigger?: number
}

export function MobileHiveList({ selectedGroupId, onSelectGroup, refreshTrigger }: MobileHiveListProps) {
  const { data: session } = useSession()
  const { isConnected, joinGroups: joinSocketGroups, onMessageReceived, offMessageReceived, onGroupDeleted, offGroupDeleted, onMemberLeft, offMemberLeft } = useSocket()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const { notification, showSuccess, showInfo, hideNotification } = useNativeNotification()

  useEffect(() => {
    if (session?.user) {
      fetchMyGroups()
    }
  }, [session, refreshTrigger])

  // WebSocket setup for real-time messaging
  useEffect(() => {
    if (session?.user) {
      console.log('🔌 Setting up WebSocket listeners for Mobile Hive List')
      
      const handleMessageReceived = (data: any) => {
        console.log('🔌 Mobile: Received new message via WebSocket:', data)
        
        // Update unread count only if user isn't viewing this group
        if (selectedGroupId !== data.groupId) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.groupId]: (prev[data.groupId] || 0) + 1
          }))
        }

        // Update the last message and move group to top
        setGroups(prevGroups => {
          const updatedGroups = prevGroups.map(group => 
            group.id === data.groupId 
              ? { 
                  ...group, 
                  lastMessage: {
                    content: data.message.content,
                    createdAt: data.message.createdAt,
                    user: data.message.user || { name: 'Unknown User' }
                  },
                  updatedAt: data.message.createdAt
                }
              : group
          )
          
          // Sort groups by updatedAt (newest first)
          return updatedGroups.sort((a, b) => {
            const aTime = new Date(a.updatedAt).getTime()
            const bTime = new Date(b.updatedAt).getTime()
            return bTime - aTime
          })
        })
      }

      const handleGroupDeleted = (data: any) => {
        console.log('🔌 Mobile: Received group deletion via WebSocket:', data)
        setGroups(prevGroups => prevGroups.filter(group => group.id !== data.groupId))
        setUnreadCounts(prev => {
          const { [data.groupId]: deleted, ...rest } = prev
          return rest
        })
      }

      const handleMemberLeft = (data: any) => {
        if (data && data.userId && data.currentUserId && data.groupId) {
          if (data.userId === data.currentUserId) {
            setGroups(prevGroups => prevGroups.filter(g => g.id !== data.groupId))
          }
        }
      }

      onMessageReceived(handleMessageReceived)
      onGroupDeleted(handleGroupDeleted)
      onMemberLeft(handleMemberLeft)

      return () => {
        console.log('🔌 Mobile: Cleaning up WebSocket listeners')
        offMessageReceived()
        offGroupDeleted()
        offMemberLeft()
      }
    }
  }, [session?.user?.id, selectedGroupId])

  // Join groups for real-time updates
  useEffect(() => {
    if (groups.length > 0 && session?.user) {
      console.log('🔌 Mobile: Joining groups for real-time updates:', groups.length, 'groups')
      const groupIds = groups.map(group => group.id)
      joinSocketGroups(groupIds)
    }
  }, [groups.length, session?.user?.id])

  // Clear unread count when user selects a group
  useEffect(() => {
    if (selectedGroupId) {
      setUnreadCounts(prev => ({
        ...prev,
        [selectedGroupId]: 0
      }))
    }
  }, [selectedGroupId])

  const fetchMyGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        const groups = data.groups || []
        
        // Sort groups by updatedAt (newest first)
        const sortedGroups = groups.sort((a: Group, b: Group) => {
          const aTime = new Date(a.updatedAt).getTime()
          const bTime = new Date(b.updatedAt).getTime()
          return bTime - aTime
        })
        
        setGroups(sortedGroups)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
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

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  const handleRefresh = async () => {
    await fetchMyGroups()
    showInfo('Hives refreshed!')
  }

  const handleArchiveGroup = (groupId: string) => {
    showInfo('Archive feature coming soon!')
  }

  const handleGroupSettings = (groupId: string) => {
    showInfo('Group settings opened!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center mt-20">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">No Hives Yet</h3>
        <p className="text-gray-600 mb-8 leading-relaxed px-4">
          Start your first conversation by creating a Hive or join existing ones from Explore
        </p>
        <div className="w-full max-w-sm">
          <div className="bg-gradient-primary rounded-2xl p-4 text-white text-center">
            <p className="text-sm font-medium">Tap the + button to create your first Hive!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
      <div className="h-full bg-white">
        {/* Hive List */}
        <div className="divide-y divide-gray-100">
          {groups.map((group) => (
            <SwipeableCard
              key={group.id}
              leftAction={{
                icon: <Archive className="w-6 h-6" />,
                color: '#6B7280',
                action: () => handleArchiveGroup(group.id)
              }}
              rightAction={{
                icon: <Settings className="w-6 h-6" />,
                color: '#4F46E5',
                action: () => handleGroupSettings(group.id)
              }}
            >
              <div
                className="bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  // Clear unread count for this group
                  setUnreadCounts(prev => ({
                    ...prev,
                    [group.id]: 0
                  }))
                  onSelectGroup(group.id)
                }}
              >
                <div className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    {/* Group Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center overflow-hidden">
                        {group.profileImage ? (
                          <img
                            src={group.profileImage}
                            alt={group.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Hash className="w-7 h-7 text-white" />
                        )}
                      </div>
                      
                      {/* Unread badge */}
                      {unreadCounts[group.id] > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[22px] h-5 flex items-center justify-center px-1 font-semibold border-2 border-white">
                          {unreadCounts[group.id] > 99 ? '99+' : unreadCounts[group.id]}
                        </div>
                      )}
                    </div>
                    
                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate text-base">
                            {group.name}
                          </h3>
                          
                          {/* Badges */}
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {group.contractAddress && (
                              <div className="bg-yellow-100 p-1 rounded-lg" title="Token-gated">
                                <Lock className="w-3 h-3 text-yellow-600" />
                              </div>
                            )}
                            {group.isCreator && (
                              <div className="bg-purple-100 p-1 rounded-lg" title="You own this hive">
                                <Crown className="w-3 h-3 text-purple-600" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-gray-500">
                            {group.lastMessage 
                              ? formatTime(group.lastMessage.createdAt)
                              : formatTime(group.updatedAt)
                            }
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {group.lastMessage 
                            ? (
                              <span>
                                <span className="font-medium">{group.lastMessage.user.name}:</span>
                                <span className="ml-1">{truncateMessage(group.lastMessage.content, 35)}</span>
                              </span>
                            )
                            : (
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                              </span>
                            )
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwipeableCard>
          ))}
        </div>
      </div>
    </PullToRefresh>

      {/* Native Notification */}
      {notification && (
        <NativeNotification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      )}
    </div>
  )
}
