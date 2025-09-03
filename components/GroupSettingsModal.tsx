'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Hash, Save, Trash2, Users } from 'lucide-react'

interface Group {
  id: string
  name: string
  profileImage: string | null
  contractAddress: string | null
  memberCount: number
  isCreator?: boolean
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
            <div className="space-y-4">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Group Members</h3>
                <p className="text-dark-400">Member management coming soon</p>
              </div>
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
    </div>
  )
}
