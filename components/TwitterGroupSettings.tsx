'use client'

import { useState, useEffect } from 'react'
import { X, Edit3, LogOut, Calendar, Users, Trash2, UserMinus } from 'lucide-react'
import { resizeImage, isImageFile } from '../lib/imageResize'
import { useSocket } from '../lib/socketContext'
import { useNativeNotification, NativeNotification } from './NativeNotification'

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
  createdAt?: string
}

interface TwitterGroupSettingsProps {
  group: Group
  onClose: () => void
  onGroupUpdated: () => void
  onGroupDeleted?: () => void
  onNavigateToMyHives?: () => void
}

export function TwitterGroupSettings({ group, onClose, onGroupUpdated, onGroupDeleted, onNavigateToMyHives }: TwitterGroupSettingsProps) {
  const [activeView, setActiveView] = useState<'info' | 'members' | 'edit'>('info')
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false)
  const [leaveConfirmationText, setLeaveConfirmationText] = useState('')
  const [isLeavingGroup, setIsLeavingGroup] = useState(false)
  const [editForm, setEditForm] = useState({
    name: group.name,
    contractAddress: group.contractAddress || '',
    profileImage: null as File | null
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(group.profileImage)
  const { showSuccess, showInfo, notification, hideNotification } = useNativeNotification()
  const { onMemberLeft, offMemberLeft } = useSocket()

  // Listen for when current user leaves group (real-time navigation)
  useEffect(() => {
    const handleMemberLeft = (data: any) => {
      console.log('Member left event received:', data)
      // Check if data is valid before processing
      if (data && data.userId && data.currentUserId && data.groupId) {
        // If current user left the group, navigate to My Hives
        if (data.userId === data.currentUserId && data.groupId === group.id) {
          console.log('Current user left this group, navigating to My Hives')
          onClose()
          if (onNavigateToMyHives) {
            onNavigateToMyHives()
          }
        }
      } else {
        console.log('Invalid member left data received:', data)
      }
    }

    onMemberLeft(handleMemberLeft)
    return () => offMemberLeft()
  }, [group.id, onMemberLeft, offMemberLeft, onClose, onNavigateToMyHives])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isImageFile(file)) {
      alert('Please select a valid image file')
      return
    }

    try {
      console.log('Original file size:', file.size, 'bytes')
      
      // Resize image if it's larger than 1MB or dimensions are too big
      let processedFile = file
      if (file.size > 1024 * 1024 || file.size > 500 * 1024) {
        console.log('Resizing image...')
        processedFile = await resizeImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          format: 'jpeg'
        })
        console.log('Resized file size:', processedFile.size, 'bytes')
      }

      setEditForm(prev => ({ ...prev, profileImage: processedFile }))
      const url = URL.createObjectURL(processedFile)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Failed to process image. Please try a different image.')
    }
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.name.trim()) return

    setIsLoading(true)
    try {
      const submitData = new FormData()
      submitData.append('name', editForm.name.trim())
      submitData.append('contractAddress', editForm.contractAddress.trim())
      if (editForm.profileImage) {
        submitData.append('profileImage', editForm.profileImage)
      }

      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        body: submitData,
      })

      if (response.ok) {
        onGroupUpdated()
        setActiveView('info')
      }
    } catch (error) {
      console.error('Error updating group:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the Hive?')) return

    try {
      const response = await fetch(`/api/groups/${group.id}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onGroupUpdated()
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const handleLeaveGroup = async () => {
    if (!showLeaveConfirmation) {
      setShowLeaveConfirmation(true)
      return
    }

    if (leaveConfirmationText !== 'LEAVE') {
      return
    }

    setIsLeavingGroup(true)
    try {
      const response = await fetch(`/api/groups/${group.id}/leave`, {
        method: 'POST'
      })

      if (response.ok) {
        showSuccess('Successfully left the Hive')
        setShowLeaveConfirmation(false)
        setLeaveConfirmationText('')
        // The WebSocket listener will handle navigation automatically
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to leave group')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      alert('Failed to leave group')
    } finally {
      setIsLeavingGroup(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (deleteConfirmationText !== 'DELETE') return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowDeleteConfirmation(false)
        onClose()
        if (onGroupDeleted) {
          onGroupDeleted()
        }
      }
    } catch (error) {
      console.error('Failed to delete Hive:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => activeView === 'info' ? onClose() : setActiveView('info')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeView === 'info' && 'Hive info'}
              {activeView === 'members' && 'People'}
              {activeView === 'edit' && 'Edit Hive'}
            </h2>
          </div>
          {activeView === 'info' && group.isCreator && (
            <button
              onClick={() => setActiveView('edit')}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm px-3 py-1 hover:bg-blue-50 rounded-full transition-colors"
            >
              Edit
            </button>
          )}
          {activeView === 'edit' && (
            <button
              onClick={handleSaveChanges}
              disabled={isLoading || !editForm.name.trim()}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm px-3 py-1 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {activeView === 'info' && (
            <div className="p-6 space-y-6">
              {/* Group Image and Name */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                  {group.profileImage ? (
                    <img src={group.profileImage} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">{group.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                <p className="text-gray-500 text-sm">{group.memberCount} members</p>
              </div>

              {/* Group Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-sm text-gray-500">{formatDate(group.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Members</p>
                      <p className="text-sm text-gray-500">{group.memberCount} people</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveView('members')}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {!group.isCreator && (
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Leave Hive</span>
                  </button>
                )}

                {group.isCreator && (
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Delete Hive</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeView === 'members' && (
            <div className="p-4">
              <div className="space-y-1">
                {group.members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {member.profileImage ? (
                          <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">{member.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">@{member.twitterHandle}</p>
                      </div>
                    </div>
                    {group.isCreator && member.id !== group.members?.find(m => m.id === member.id)?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'edit' && (
            <form onSubmit={handleSaveChanges} className="p-6 space-y-6">
              {/* Group Image */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">{editForm.name.charAt(0).toUpperCase()}</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Tap to change photo</p>
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hive Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter hive name"
                />
              </div>

              {/* Token Contract */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Token Contract Address</label>
                <input
                  type="text"
                  value={editForm.contractAddress}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contractAddress: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0x... (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for public hive</p>
              </div>
            </form>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-10">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete "{group.name}"?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  This action will permanently delete this Hive and all its content:
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• All messages will be deleted permanently</li>
                  <li>• All members will be removed</li>
                  <li>• All announcements will be lost</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

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

        {/* Leave Confirmation Modal */}
        {showLeaveConfirmation && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-10">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-6">
                <LogOut className="w-8 h-8 text-orange-600" />
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Leave "{group.name}"?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Are you sure you want to leave this Hive? You'll need to request to join again if you want to come back.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold text-orange-600">LEAVE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={leaveConfirmationText}
                  onChange={(e) => setLeaveConfirmationText(e.target.value)}
                  placeholder="Type LEAVE here"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowLeaveConfirmation(false)
                    setLeaveConfirmationText('')
                  }}
                  disabled={isLeavingGroup}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveGroup}
                  disabled={isLeavingGroup || leaveConfirmationText !== 'LEAVE'}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center"
                >
                  {isLeavingGroup ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Leaving...
                    </>
                  ) : (
                    'Leave Hive'
                  )}
                </button>
              </div>
            </div>
          </div>
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
