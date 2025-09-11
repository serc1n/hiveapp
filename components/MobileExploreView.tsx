'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Hash, Users, Lock, Crown, ChevronRight, Compass, Sparkles } from 'lucide-react'
import { useSocket } from '../lib/socketContext'
import { NativeNotification, useNativeNotification } from './NativeNotification'

interface Group {
  id: string
  name: string
  profileImage: string | null
  memberCount: number
  contractAddress: string | null
  isCreator?: boolean
  hasAccess: boolean
  updatedAt: string
  description?: string
}

interface MobileExploreViewProps {
  onSelectGroup: (groupId: string) => void
}

export function MobileExploreView({ onSelectGroup }: MobileExploreViewProps) {
  const { data: session } = useSession()
  const { onGroupCreated, offGroupCreated } = useSocket()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set())
  const { notification, showSuccess, showInfo, hideNotification } = useNativeNotification()

  useEffect(() => {
    if (session?.user) {
      fetchExploreGroups()
    }
  }, [session])

  // WebSocket setup for new group creation
  useEffect(() => {
    if (session?.user) {
      console.log('🔌 Mobile Explore: Setting up WebSocket listeners')
      
      const handleGroupCreated = (data: any) => {
        console.log('🔌 Mobile Explore: Received new group creation:', data)
        setGroups((prevGroups: Group[]) => {
          const existingGroup = prevGroups.find(group => group.id === data.group.id)
          if (existingGroup) return prevGroups
          return [data.group, ...prevGroups]
        })
      }

      onGroupCreated(handleGroupCreated)

      return () => {
        console.log('🔌 Mobile Explore: Cleaning up WebSocket listeners')
        offGroupCreated()
      }
    }
  }, [session?.user?.id])

  const fetchExploreGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/groups/browse')
      if (response.ok) {
        const data = await response.json()
        const groups = data.groups || []
        setGroups(groups)
      }
    } catch (error) {
      console.error('Error fetching explore groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    setJoiningGroups(prev => new Set(Array.from(prev).concat(groupId)))
    
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.requiresApproval) {
          showInfo('Request sent! Waiting for approval')
          fetchExploreGroups()
        } else {
          showSuccess('Successfully joined the hive!')
          fetchExploreGroups()
          // Auto-open the joined group
          onSelectGroup(groupId)
        }
      } else {
        const error = await response.json()
        showInfo(`${error.error || 'Failed to join hive'}${error.details ? ` (${error.details})` : ''}`)
      }
    } catch (error) {
      console.error('Error joining group:', error)
      showInfo('Failed to join hive')
    } finally {
      setJoiningGroups(prev => {
        const newArray = Array.from(prev).filter(id => id !== groupId)
        return new Set(newArray)
      })
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Header */}
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <div className="relative max-w-7xl mx-auto">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search hives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center mt-20">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
              <Compass className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {searchQuery ? 'No Results Found' : 'All Caught Up!'}
            </h3>
            <p className="text-gray-600 leading-relaxed px-4">
              {searchQuery 
                ? `No hives found matching "${searchQuery}"`
                : 'You\'ve joined all available hives. New ones will appear here when created.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {!searchQuery && (
              <div className="px-4 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center space-x-3 mb-3">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Discover New Hives</h2>
                  </div>
                  <p className="text-base text-gray-600">
                    Join conversations that match your interests
                  </p>
                </div>
              </div>
            )}

            {/* Hive List */}
            <div className="divide-y divide-gray-100">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className={`bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer ${
                    !group.hasAccess ? '' : 'opacity-75'
                  }`}
                  onClick={() => {
                    if (group.hasAccess) {
                      onSelectGroup(group.id)
                    }
                  }}
                >
                  <div className="px-4 py-5">
                    <div className="max-w-7xl mx-auto">
                      <div className="flex items-center space-x-4">
                        {/* Group Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center overflow-hidden">
                          {group.profileImage ? (
                            <img
                              src={group.profileImage}
                              alt={group.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Hash className="w-8 h-8 text-white" />
                          )}
                        </div>
                        </div>
                        
                        {/* Group Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate text-lg">
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
                          
                          {/* Join Button or Arrow */}
                          {!group.hasAccess ? (
                            <button
                              onClick={(e) => handleJoinGroup(group.id, e)}
                              disabled={joiningGroups.has(group.id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm rounded-xl font-medium transition-colors flex-shrink-0 min-w-[80px] flex items-center justify-center"
                            >
                              {joiningGroups.has(group.id) ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                'Join'
                              )}
                            </button>
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <p className="text-base text-gray-600 flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {formatMemberCount(group.memberCount)} members
                              </p>
                              
                              {group.contractAddress && (
                                <p className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg font-medium">
                                  Token Gated
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Description if available */}
                          {group.description && (
                            <p className="text-base text-gray-500 mt-2 line-clamp-2">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </>
        )}
      </div>

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
