'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Hash, ArrowLeft, Camera, Image as ImageIcon, Check } from 'lucide-react'
import { resizeImage, isImageFile } from '../lib/imageResize'

interface MobileCreateHiveModalProps {
  onClose: () => void
  onGroupCreated: () => void
}

export function MobileCreateHiveModal({ onClose, onGroupCreated }: MobileCreateHiveModalProps) {
  const [step, setStep] = useState<'basic' | 'image' | 'settings' | 'review'>('basic')
  const [formData, setFormData] = useState({
    name: '',
    contractAddress: '',
    profileImage: null as File | null,
    requiresApproval: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isImageFile(file)) {
      alert('Please select a valid image file')
      return
    }

    try {
      let processedFile = file
      if (file.size > 1024 * 1024) {
        processedFile = await resizeImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          format: 'jpeg'
        })
      }

      setFormData(prev => ({ ...prev, profileImage: processedFile }))
      const url = URL.createObjectURL(processedFile)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try again.')
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a hive name')
      return
    }

    setIsLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('contractAddress', formData.contractAddress)
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
        alert(error.error || 'Failed to create hive')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create hive')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'basic':
        return formData.name.trim().length > 0
      case 'image':
        return true // Optional step
      case 'settings':
        return true // Optional step
      case 'review':
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    switch (step) {
      case 'basic':
        setStep('image')
        break
      case 'image':
        setStep('settings')
        break
      case 'settings':
        setStep('review')
        break
      case 'review':
        handleSubmit()
        break
    }
  }

  const prevStep = () => {
    switch (step) {
      case 'image':
        setStep('basic')
        break
      case 'settings':
        setStep('image')
        break
      case 'review':
        setStep('settings')
        break
      default:
        onClose()
        break
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'basic':
        return 'Create New Hive'
      case 'image':
        return 'Add Hive Image'
      case 'settings':
        return 'Hive Settings'
      case 'review':
        return 'Review & Create'
      default:
        return 'Create Hive'
    }
  }

  const getStepNumber = () => {
    switch (step) {
      case 'basic':
        return 1
      case 'image':
        return 2
      case 'settings':
        return 3
      case 'review':
        return 4
      default:
        return 1
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Status Bar Spacer */}
      <div className="h-safe-area-top bg-white"></div>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {step === 'basic' ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            )}
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {getStepTitle()}
            </h1>
            <div className="flex items-center justify-center space-x-2 mt-1">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    num <= getStepNumber() ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {step === 'basic' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                What's your Hive about?
              </h2>
              <p className="text-gray-600">
                Give your community a name that represents what you're building together.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hive Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., NFT Collectors, Crypto Traders..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  maxLength={50}
                  autoFocus
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {formData.name.length}/50
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'image' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Add a Hive Image
              </h2>
              <p className="text-gray-600">
                Help members recognize your hive with a custom image.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Image Preview */}
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-gray-100 rounded-3xl flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="w-full flex items-center justify-center py-4 px-6 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  <Upload className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-gray-600 font-medium">
                    {previewUrl ? 'Change Image' : 'Choose Image'}
                  </span>
                </label>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Recommended: Square image, at least 400x400px
              </p>
            </div>
          </div>
        )}

        {step === 'settings' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Hive Settings
              </h2>
              <p className="text-gray-600">
                Configure how members can join your hive.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Approval Setting */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      Require Approval
                    </h3>
                    <p className="text-sm text-gray-600">
                      Review join requests before members can access your hive
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        requiresApproval: e.target.checked 
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
              
              {/* Token Gating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Gate (Optional)
                </label>
                <input
                  type="text"
                  value={formData.contractAddress}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contractAddress: e.target.value 
                  }))}
                  placeholder="0x... (NFT Contract Address)"
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Only holders of this NFT collection can join
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Create?
              </h2>
              <p className="text-gray-600">
                Review your hive details before creating.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Hive Preview */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Hive"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Hash className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formData.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      1 member • Created by you
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requires Approval:</span>
                    <span className="font-medium">
                      {formData.requiresApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Gated:</span>
                    <span className="font-medium">
                      {formData.contractAddress ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {formData.contractAddress && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 break-all">
                        {formData.contractAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 safe-area-pb">
        <button
          onClick={nextStep}
          disabled={!canProceed() || isLoading}
          className="btn-mobile-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating...</span>
            </div>
          ) : step === 'review' ? (
            'Create Hive'
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  )
}
