'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Users, Lock, Globe, Plus } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUpload'

interface Group {
  id: string
  name: string
  profileImage: string | null
  contractAddress: string | null
  memberCount: number
  isCreator: boolean
  isMember: boolean
}

export default function BrowsePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return // Still loading session
    
    if (session?.user) {
      fetchGroups()
    } else {
      setLoading(false) // No session, stop loading
    }
  }, [session, status])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups/browse')
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

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroup(groupId)
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update the group in the list to show as joined
        setGroups(prev => prev.map(group => 
          group.id === groupId 
            ? { ...group, isMember: true, memberCount: group.memberCount + 1 }
            : group
        ))
        // Navigate to the group chat
        router.push(`/groups/${groupId}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join group')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group')
    } finally {
      setJoiningGroup(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-semibold mb-4">Please sign in to browse groups</h2>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading groups...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Browse Groups</h1>
            <p className="text-dark-400 mt-2">Discover and join communities</p>
          </div>
          <button
            onClick={() => router.push('/groups')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No groups available</h2>
            <p className="text-dark-400 mb-6">Be the first to create a group!</p>
            <button
              onClick={() => router.push('/groups')}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Create First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.id} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={getImageUrl(group.profileImage, 'group')}
                    alt={group.name}
                    className="w-12 h-12 rounded-lg object-cover bg-dark-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{group.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-dark-400">
                      <Users className="w-4 h-4" />
                      <span>{group.memberCount} members</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  {group.contractAddress ? (
                    <div className="flex items-center space-x-1 text-sm text-green-400">
                      <Lock className="w-4 h-4" />
                      <span>Token Gated</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-sm text-blue-400">
                      <Globe className="w-4 h-4" />
                      <span>Open</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {group.isMember ? (
                    <button
                      onClick={() => router.push(`/groups/${group.id}`)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-center"
                    >
                      Open Chat
                    </button>
                  ) : group.isCreator ? (
                    <button
                      onClick={() => router.push(`/groups/${group.id}`)}
                      className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors text-center"
                    >
                      Manage
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={joiningGroup === group.id}
                      className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed rounded-lg transition-colors text-center"
                    >
                      {joiningGroup === group.id ? 'Joining...' : 'Join Group'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
