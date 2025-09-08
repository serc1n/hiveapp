'use client'

import { useState } from 'react'
import { X, Upload, Hash } from 'lucide-react'
import { resizeImage, isImageFile } from '../lib/imageResize'

interface CreateGroupModalProps {
  onClose: () => void
  onGroupCreated: () => void
}

export function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    contractAddress: '',
    profileImage: null as File | null,
    requiresApproval: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

      setFormData(prev => ({ ...prev, profileImage: processedFile }))
      const url = URL.createObjectURL(processedFile)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Failed to process image. Please try a different image.')
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
      submitData.append('requiresApproval', formData.requiresApproval.toString())
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
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-modern">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Hive</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Image */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Group preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Hash className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hive Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter hive name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
              maxLength={50}
            />
          </div>

          {/* Contract Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token Contract Address (Optional)
            </label>
            <input
              type="text"
              value={formData.contractAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, contractAddress: e.target.value }))}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-600 mt-1">
              Add a contract address to make this a token-gated group
            </p>
          </div>

          {/* Join Approval Setting */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Require Join Approval</span>
                <p className="text-xs text-gray-600">
                  Users will need to request to join and wait for your approval
                </p>
              </div>
            </label>
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
