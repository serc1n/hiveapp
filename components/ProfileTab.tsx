'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, Wallet, Edit3, Save, X, LogOut } from 'lucide-react'
import { WalletConnection } from './WalletConnection'
import { AppSettings } from './AppSettings'

export function ProfileTab() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [tempBio, setTempBio] = useState('')
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setBio(data.bio || '')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleSaveBio = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: tempBio }),
      })

      if (response.ok) {
        setBio(tempBio)
        setIsEditing(false)
      } else {
        alert('Failed to save bio')
      }
    } catch (error) {
      console.error('Error saving bio:', error)
      alert('Error saving bio')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditBio = () => {
    console.log('Edit bio button clicked!')
    setTempBio(bio)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setTempBio('')
    setIsEditing(false)
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h3>
          <p className="text-gray-600">Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)' }}>
        {/* Profile Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{session.user.name}</h2>
              <p className="text-gray-600">@{session.user.name}</p>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Bio</h3>
              {!isEditing && (
                <button
                  onClick={handleEditBio}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Bio"
                >
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none rounded-xl"
                  rows={3}
                  maxLength={200}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{tempBio.length}/200 characters</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors flex items-center"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBio}
                      disabled={isSaving}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white disabled:text-white text-sm transition-colors flex items-center font-medium rounded-lg"
                    >
                      {isSaving ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <Save className="w-3 h-3 mr-1" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 min-h-[60px] flex items-center border border-gray-200">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {bio || (
                    <span className="text-gray-500 italic">No bio added yet. Click edit to add one.</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Wallet Connection
            </h3>
            <button
              onClick={() => setShowWalletModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors font-medium rounded-lg"
            >
              Manage Wallet
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            {session.user.walletAddress ? (
              <div>
                <p className="text-sm text-gray-600 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm text-gray-900">
                  {session.user.walletAddress.slice(0, 8)}...{session.user.walletAddress.slice(-6)}
                </p>
                <p className="text-xs text-green-600 mt-2">✓ Wallet connected</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">No wallet connected</p>
                <p className="text-xs text-gray-500">
                  Connect your wallet to access token-gated groups
                </p>
              </div>
            )}
          </div>
        </div>

        {/* App Settings */}
        <AppSettings />

        {/* Account Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account</h3>
          
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white transition-colors font-medium rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <WalletConnection onClose={() => setShowWalletModal(false)} />
      )}
    </div>
  )
}
