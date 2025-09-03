'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, User, Edit3, Save, Wallet } from 'lucide-react'

interface UserProfileProps {
  onClose: () => void
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { data: session, update } = useSession()
  const [bio, setBio] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.bio) {
      setBio(session.user.bio)
    }
  }, [session])

  const handleSaveBio = async () => {
    if (!session?.user?.id) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: bio.trim() }),
      })

      if (response.ok) {
        await update() // Refresh session
        setIsEditing(false)
      } else {
        alert('Failed to update bio')
      }
    } catch (error) {
      console.error('Error updating bio:', error)
      alert('Failed to update bio')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <User className="w-6 h-6 mr-2" />
            Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Info */}
          <div className="text-center">
            <img
              src={session?.user.image || '/default-avatar.png'}
              alt={session?.user.name || 'User'}
              className="w-20 h-20 rounded-full mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-white">
              {session?.user.name}
            </h3>
            <p className="text-dark-400">@{session?.user.twitterHandle}</p>
          </div>

          {/* Wallet Status */}
          <div className="p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-dark-400 mr-2" />
                <span className="text-white">Wallet</span>
              </div>
              <div>
                {session?.user.walletAddress ? (
                  <span className="text-green-500 text-sm font-mono">
                    {session.user.walletAddress.slice(0, 6)}...{session.user.walletAddress.slice(-4)}
                  </span>
                ) : (
                  <span className="text-dark-400 text-sm">Not connected</span>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-dark-300">Bio</label>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-dark-700 rounded text-primary-500 hover:text-primary-400"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSaveBio}
                  disabled={isSaving}
                  className="p-1 hover:bg-dark-700 rounded text-green-500 hover:text-green-400"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full h-24 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  maxLength={200}
                />
                <div className="flex justify-between text-xs text-dark-400">
                  <span>{bio.length}/200 characters</span>
                  <button
                    onClick={() => {
                      setBio(session?.user?.bio || '')
                      setIsEditing(false)
                    }}
                    className="text-dark-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-dark-700 rounded-lg min-h-[60px]">
                {bio || session?.user?.bio ? (
                  <p className="text-white text-sm whitespace-pre-wrap">
                    {bio || session?.user?.bio}
                  </p>
                ) : (
                  <p className="text-dark-400 text-sm italic">
                    No bio added yet. Click edit to add one.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-dark-400">Groups Joined</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-dark-400">Messages Sent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
