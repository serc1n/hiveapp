'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Plus, Settings, User, Wallet, LogOut, Hash, Bell } from 'lucide-react'
import { CreateGroupModal } from './CreateGroupModal'
import { UserProfile } from './UserProfile'

interface Group {
  id: string
  name: string
  profileImage: string | null
  contractAddress: string | null
  memberCount: number
  hasAccess: boolean
}

interface SidebarProps {
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
  onShowWalletModal: () => void
}

export function Sidebar({ selectedGroupId, onSelectGroup, onShowWalletModal }: SidebarProps) {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

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
      setIsLoading(false)
    }
  }

  const handleGroupCreated = () => {
    fetchGroups()
    setShowCreateModal(false)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">HiveApp</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              title="Create Group"
            >
              <Plus className="w-5 h-5 text-dark-400" />
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-dark-400 text-sm">Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8">
                <Hash className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                <p className="text-dark-400 text-sm">No groups yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-primary-500 text-sm hover:text-primary-400 mt-1"
                >
                  Create your first group
                </button>
              </div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedGroupId === group.id
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-dark-700 text-dark-300'
                  } ${!group.hasAccess ? 'opacity-60' : ''}`}
                  disabled={!group.hasAccess}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-dark-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {group.profileImage ? (
                        <img
                          src={group.profileImage}
                          alt={group.name}
                          className="w-10 h-10 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement!
                            parent.innerHTML = '<svg class="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>'
                          }}
                        />
                      ) : (
                        <Hash className="w-5 h-5 text-dark-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium truncate">{group.name}</h3>
                        {group.contractAddress && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Token Gated" />
                        )}
                        {!group.hasAccess && (
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="No Access" />
                        )}
                      </div>
                      <p className="text-xs text-dark-400">{group.memberCount} members</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={session?.user.image || '/default-avatar.png'}
              alt={session?.user.name || 'User'}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{session?.user.name}</p>
              <p className="text-sm text-dark-400 truncate">@{session?.user.twitterHandle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center justify-center p-2 hover:bg-dark-700 rounded-lg transition-colors"
              title="Profile"
            >
              <User className="w-4 h-4 text-dark-400" />
            </button>
            <button
              onClick={onShowWalletModal}
              className="flex items-center justify-center p-2 hover:bg-dark-700 rounded-lg transition-colors"
              title="Connect Wallet"
            >
              <Wallet className="w-4 h-4 text-dark-400" />
            </button>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full mt-2 flex items-center justify-center p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
    </>
  )
}
