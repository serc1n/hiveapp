'use client'

import { useState } from 'react'
import { X, Upload, Hash } from 'lucide-react'

interface CreateGroupModalProps {
  onClose: () => void
  onGroupCreated: () => void
}

export function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    contractAddress: '',
    profileImage: null as File | null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

      const response = await fetch('/api/groups', {
        method: 'POST',
        body: submitData,
      })

      if (response.ok) {
        onGroupCreated()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Group</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Image */}
          <div className="text-center">
            <div className="w-20 h-20 bg-dark-700 rounded-xl mx-auto mb-3 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Group preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Hash className="w-8 h-8 text-dark-400" />
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center text-primary-500 hover:text-primary-400 text-sm">
              <Upload className="w-4 h-4 mr-1" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter group name"
              className="input-field"
              required
              maxLength={50}
            />
          </div>

          {/* Contract Address */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Token Contract Address (Optional)
            </label>
            <input
              type="text"
              value={formData.contractAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, contractAddress: e.target.value }))}
              placeholder="0x..."
              className="input-field"
            />
            <p className="text-xs text-dark-400 mt-1">
              Add a contract address to make this a token-gated group
            </p>
          </div>

          {/* Action Buttons */}
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
              className="flex-1 btn-primary"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
