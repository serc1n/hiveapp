'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Lock, Globe, UserPlus, MessageCircle, Search } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUpload'

interface Group {
  id: string
  name: string
  profileImage: string | null
  contractAddress: string | null
  memberCount: number
  isCreator: boolean
  isMember: boolean
  requiresApproval?: boolean
  joinRequestStatus?: string | null
}

interface BrowseHivesTabProps {
  onSelectGroup: (groupId: string) => void
}

export function BrowseHivesTab({ onSelectGroup }: BrowseHivesTabProps) {
  const { data: session, status } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      fetchGroups()
      
      // Set up polling for new groups every 15 seconds
      const groupInterval = setInterval(() => {
        if (!document.hidden && session?.user) {
          fetchGroups()
        }
      }, 15000)
      
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
    } else {
      setLoading(false)
    }
  }, [session, status])

  const fetchGroups = async () => {
    try {
      console.log('Fetching groups...') // Debug log
      const response = await fetch('/api/groups/browse')
      console.log('Response status:', response.status) // Debug log
      
      if (response.ok) {
        const data = await response.json()
        console.log('Groups data:', data) // Debug log
        setGroups(data.groups)
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData) // Debug log
        alert(`Failed to load groups: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      alert('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering onSelectGroup
    
    console.log('Attempting to join group:', groupId) // Debug log
    setJoiningGroup(groupId)
    
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Join response status:', response.status) // Debug log

      if (response.ok) {
        const result = await response.json()
        console.log('Join success:', result) // Debug log
        
        if (result.requiresApproval) {
          // Join request submitted (approval required)
          alert('Join request submitted! The group owner will review your request.')
          // Remove group from explore list since user has requested to join
          setGroups(prev => prev.filter(group => group.id !== groupId))
        } else {
          // User joined directly (no approval required)
          setGroups(prev => prev.map(group => 
            group.id === groupId 
              ? { ...group, isMember: true, memberCount: group.memberCount + 1 }
              : group
          ))
          alert('Successfully joined the hive!')
          onSelectGroup(groupId)
        }
      } else {
        const error = await response.json()
        console.error('Join error:', error) // Debug log
        alert(error.error || 'Failed to join group')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group. Please try again.')
    } finally {
      setJoiningGroup(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h2 className="text-xl font-semibold mb-4">Please sign in to explore</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading groups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Mobile Header - Hidden on Desktop */}
      <div className="md:hidden p-4 border-b border-gray-800 bg-black flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Explore</h1>
        <p className="text-gray-400 text-sm mt-1">Discover new communities</p>
      </div>

      {/* Desktop Search/Info */}
      <div className="hidden md:block p-4 border-b border-gray-800 flex-shrink-0">
        <p className="text-gray-400 text-sm">Discover new communities</p>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-800" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>
        {groups.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Nothing to explore</h2>
            <p className="text-gray-400">All available groups have been joined!</p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="p-4 hover:bg-gray-950 transition-colors border-l-2 border-l-transparent hover:border-l-gray-700"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {group.profileImage ? (
                    <img
                      src={getImageUrl(group.profileImage, 'group')}
                      alt={group.name}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white truncate text-sm">{group.name}</h3>
                      {group.contractAddress && (
                        <Lock className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <button
                      onClick={(e) => handleJoinGroup(group.id, e)}
                      disabled={joiningGroup === group.id}
                      className="px-3 py-1 bg-white text-black rounded-full font-medium text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {joiningGroup === group.id ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                  
                  <p className="text-gray-400 text-xs truncate">
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} • {group.contractAddress ? 'Token gated' : 'Open group'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
