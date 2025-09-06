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
  onGroupDeleted?: () => void
}

export function GroupSettingsModal({ group, onClose, onGroupUpdated, onGroupDeleted }: GroupSettingsModalProps) {
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')

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

  const handleDeleteGroup = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      return // Don't proceed if confirmation text doesn't match
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteConfirmation(false)
        onClose() // Close the modal first
        
        // Call the deletion callback to handle navigation and refresh
        if (onGroupDeleted) {
          onGroupDeleted()
        } else {
          // Fallback to full page refresh if no callback provided
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
        }
      } else {
        const error = await response.json()
        // Show error in the confirmation modal instead of alert
        console.error('Delete error:', error.error || 'Failed to delete Hive')
      }
    } catch (error) {
      console.error('Failed to delete Hive:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-modern">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Group Settings</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Group preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = '<div class="w-8 h-8 text-gray-400">#</div>'
                      }}
                    />
                  ) : (
                    <Hash className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {group.isCreator && (
                  <label className="cursor-pointer inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
                  required
                  maxLength={50}
                  disabled={!group.isCreator}
                />
              </div>

              {/* Contract Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Contract Address
                </label>
                <input
                  type="text"
                  value={formData.contractAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractAddress: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={!group.isCreator}
                />
                <p className="text-xs text-gray-600 mt-1">
                  {group.contractAddress ? 'This group is token-gated' : 'No token gating applied'}
                </p>
              </div>

              {/* Group Info */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Group Information</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-gray-900 font-medium">Recently</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Members:</span>
                    <span className="text-gray-900 font-medium">{group.memberCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-gray-900 font-medium">{group.contractAddress ? 'Token Gated' : 'Public'}</span>
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
                  <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
                    <Settings className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Panel</h3>
                    <p className="text-gray-600 mb-4">
                      Manage join requests and group members
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                      <p className="text-yellow-800 text-sm">
                        💡 <strong>Tip:</strong> Check for pending join requests that need your approval!
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAdminPanel(true)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Open Admin Panel
                    </button>
                  </div>
                </div>
              ) : (
                /* Regular Member Options */
                <div className="space-y-4">
                  {/* View Members */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <Users className="w-6 h-6 text-indigo-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Group Members</h3>
                        <p className="text-gray-600 text-sm">{group.memberCount} members in this group</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMembersList(true)}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                    >
                      View All Members
                    </button>
                  </div>

                  {/* Leave Group - For non-creators */}
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <UserMinus className="w-6 h-6 text-red-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Leave Group</h3>
                        <p className="text-gray-600 text-sm">You can rejoin anytime if it's a public group</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLeaveGroup()}
                      disabled={isLeavingGroup}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

              {/* Delete Group Section - Only for creators */}
              {group.isCreator && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Delete Hive</h3>
                      <p className="text-gray-600 text-sm">Permanently delete this Hive and all messages. This cannot be undone!</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    Delete Hive
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer for non-creators */}
        {!group.isCreator && activeTab === 'general' && (
          <div className="p-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            {/* Warning Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>

            {/* Title and Description */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete "{group.name}"?</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                This action will permanently delete this Hive and all its content:
              </p>
            </div>

            {/* Warning List */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <ul className="text-sm text-red-800 space-y-1">
                <li>• All messages will be deleted permanently</li>
                <li>• All members will be removed</li>
                <li>• All announcements will be lost</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false)
                  setDeleteConfirmationText('')
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={isLoading || deleteConfirmationText !== 'DELETE'}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
