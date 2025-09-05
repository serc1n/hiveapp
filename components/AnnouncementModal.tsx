'use client'

import { useState } from 'react'
import { X, Megaphone, Send } from 'lucide-react'

interface AnnouncementModalProps {
  messageId: string
  groupId: string
  onClose: () => void
  onAnnouncementCreated: () => void
}

export function AnnouncementModal({ 
  messageId, 
  groupId, 
  onClose, 
  onAnnouncementCreated 
}: AnnouncementModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateAnnouncement = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      })

      if (response.ok) {
        onAnnouncementCreated()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create announcement')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert('Failed to create announcement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl mt-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Megaphone className="w-6 h-6 mr-2 text-indigo-600" />
            Create Announcement
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
            <p className="text-sm text-gray-700 mb-2">
              This will create an announcement from the selected message and notify all group members.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Megaphone className="w-4 h-4" />
              <span>Announcement will appear in the group's announcements tab</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Push notifications to all group members</li>
              <li>• Message saved to announcements tab</li>
              <li>• Highlighted in chat with announcement badge</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAnnouncement}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Announcement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
