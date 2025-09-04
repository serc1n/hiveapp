'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Hash, Users, Plus, Lock } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUpload'
import { CreateGroupModal } from './CreateGroupModal'

interface Group {
  id: string
  name: string
  profileImage: string | null
  contractAddress: string | null
  memberCount: number
  isCreator: boolean
  hasAccess: boolean
  lastMessage?: {
    content: string
    createdAt: string
    user: {
      name: string
      twitterHandle: string
    }
  } | null
  updatedAt: string
}

interface MyHivesTabProps {
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
}

export function MyHivesTab({ selectedGroupId, onSelectGroup }: MyHivesTabProps) {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    if (session?.user) {
      fetchGroups()
      
      // Set up polling for group updates every 10 seconds
      const groupInterval = setInterval(() => {
        if (!document.hidden && session?.user) {
          fetchGroups()
        }
      }, 10000)
      
      // Also fetch when page becomes visible again
      const handleVisibilityChange = () => {
        if (!document.hidden && session?.user) {
          fetchGroups()
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        clearInterval(groupInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [session])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupCreated = () => {
    fetchGroups()
    setShowCreateModal(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full bg-black">
        {/* Mobile Header - Hidden on Desktop */}
        <div className="md:hidden p-4 border-b border-gray-800 bg-black flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Hives</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 hover:bg-gray-900 transition-colors"
              title="Create new group"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Desktop Create Button */}
        <div className="hidden md:block p-4 flex-shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full px-4 py-3 bg-white text-black hover:bg-gray-200 font-bold transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Hive</span>
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>
          {groups.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">No messages yet</h2>
              <p className="text-gray-400 mb-6">Start a conversation by creating your first group</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-white text-black hover:bg-gray-200 font-bold transition-colors"
              >
                Create Group
              </button>
            </div>
          ) : (
                      groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`w-full p-4 text-left transition-colors hover:bg-gray-950 border-l-2 ${
                selectedGroupId === group.id 
                  ? 'bg-gray-900 border-l-white' 
                  : 'border-l-transparent'
              } ${!group.hasAccess ? 'opacity-60' : ''}`}
              disabled={!group.hasAccess}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {group.profileImage ? (
                    <img
                      src={getImageUrl(group.profileImage, 'group')}
                      alt={group.name}
                      className="w-10 h-10 object-cover"
                    />
                  ) : (
                    <Hash className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white truncate text-sm">
                        {group.name}
                      </h3>
                      {group.contractAddress && (
                        <Lock className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      )}
                      {group.isCreator && (
                        <span className="px-1.5 py-0.5 bg-white text-black rounded text-xs flex-shrink-0 font-bold">
                          Owner
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {group.lastMessage 
                        ? formatMessageTime(group.lastMessage.createdAt)
                        : formatMessageTime(group.updatedAt)
                      }
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs truncate">
                    {group.lastMessage 
                      ? `${group.lastMessage.user.name}: ${group.lastMessage.content}`
                      : `${group.memberCount} member${group.memberCount !== 1 ? 's' : ''} · No messages yet`
                    }
                  </p>
                </div>
              </div>
            </button>
          ))
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </>
  )
}
