'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Hash, Save, Trash2, Users, Settings, UserMinus } from 'lucide-react'
import { AdminPanelModal } from './AdminPanelModal'
import { MembersListModal } from './MembersListModal'

interface Member {
  id: string
  name: string
  twitterHandle: string
  profileImage: string | null
  joinedAt: string
}

interface Group {
  id: string
  name: string
  profileImage: string | null
  contractAddress: string | null
  memberCount: number
  isCreator?: boolean
  members?: Member[]
}

interface GroupSettingsModalProps {
  group: Group
  onClose: () => void
  onGroupUpdated: () => void
}

export function GroupSettingsModal({ group, onClose, onGroupUpdated }: GroupSettingsModalProps) {
  const [formData, setFormData] = useState({
    name: group.name,
    contractAddress: group.contractAddress || '',
    profileImage: null as File | null
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(group.profileImage)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general')
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showMembersList, setShowMembersList] = useState(false)
  const [isLeavingGroup, setIsLeavingGroup] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }))
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      const submitData = new FormData()
      submitData.append('name', formData.name.trim())
      submitData.append('contractAddress', formData.contractAddress.trim())
      if (formData.profileImage) {
        submitData.append('profileImage', formData.profileImage)
      }

      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        body: submitData,
      })

      if (response.ok) {
        onGroupUpdated()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update group')
      }
    } catch (error) {
      console.error('Error updating group:', error)
      alert('Failed to update group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group? You may need to request to join again.')) {
      return
    }

    setIsLeavingGroup(true)
    try {
      const response = await fetch(`/api/groups/${group.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        alert('You have left the group successfully.')
        onGroupUpdated() // Refresh the group list
        onClose() // Close the modal
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to leave group')
      }
    } catch (error) {
      console.error('Failed to leave group:', error)
      alert('Failed to leave group. Please try again.')
    } finally {
      setIsLeavingGroup(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Group Settings</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 space-x-1 bg-dark-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white hover:bg-dark-600'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white hover:bg-dark-600'
              }`}
            >
              Members ({group.memberCount})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'general' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Image */}
              <div className="text-center">
                <div className="w-20 h-20 bg-dark-700 rounded-xl mx-auto mb-3 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Group preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = '<div class="w-8 h-8 text-dark-400">#</div>'
                      }}
                    />
                  ) : (
                    <Hash className="w-8 h-8 text-dark-400" />
                  )}
                </div>
                {group.isCreator && (
                  <label className="cursor-pointer inline-flex items-center text-primary-500 hover:text-primary-400 text-sm">
                    <Upload className="w-4 h-4 mr-1" />
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                  className="input-field"
                  required
                  maxLength={50}
                  disabled={!group.isCreator}
                />
              </div>

              {/* Contract Address */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Token Contract Address
                </label>
                <input
                  type="text"
                  value={formData.contractAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractAddress: e.target.value }))}
                  placeholder="0x..."
                  className="input-field"
                  disabled={!group.isCreator}
                />
                <p className="text-xs text-dark-400 mt-1">
                  {group.contractAddress ? 'This group is token-gated' : 'No token gating applied'}
                </p>
              </div>

              {/* Group Info */}
              <div className="bg-dark-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">Group Information</h4>
                <div className="space-y-2 text-sm text-dark-300">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>Recently</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Members:</span>
                    <span>{group.memberCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{group.contractAddress ? 'Token Gated' : 'Public'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {group.isCreator && (
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 btn-secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary flex items-center justify-center"
                    disabled={isLoading || !formData.name.trim()}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* Members Tab */
            <div className="space-y-6">
              {group.isCreator ? (
                <div>
                  <div className="bg-gray-800 rounded-lg p-6 text-center">
                    <Settings className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Admin Panel</h3>
                    <p className="text-gray-400 mb-4">
                      Manage join requests and group members
                    </p>
                    <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3 mb-4">
                      <p className="text-yellow-200 text-sm">
                        💡 <strong>Tip:</strong> Check for pending join requests that need your approval!
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAdminPanel(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Open Admin Panel
                    </button>
                  </div>
                </div>
              ) : (
                /* Regular Member Options */
                <div className="space-y-4">
                  {/* View Members */}
                  <div className="bg-dark-700 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Users className="w-6 h-6 text-blue-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Group Members</h3>
                        <p className="text-dark-300 text-sm">{group.memberCount} members in this group</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMembersList(true)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      View All Members
                    </button>
                  </div>

                  {/* Leave Group */}
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <UserMinus className="w-6 h-6 text-red-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Leave Group</h3>
                        <p className="text-dark-300 text-sm">You can rejoin anytime if it's a public group</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLeaveGroup()}
                      disabled={isLeavingGroup}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLeavingGroup ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Leaving...
                        </>
                      ) : (
                        'Leave Group'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer for non-creators */}
        {!group.isCreator && activeTab === 'general' && (
          <div className="p-6 border-t border-dark-700">
            <p className="text-sm text-dark-400 text-center">
              Only the group creator can modify these settings
            </p>
          </div>
        )}
      </div>
      
      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanelModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {/* Members List Modal */}
      {showMembersList && group.members && (
        <MembersListModal
          members={group.members}
          groupName={group.name}
          onClose={() => setShowMembersList(false)}
        />
      )}
    </div>
  )
}
