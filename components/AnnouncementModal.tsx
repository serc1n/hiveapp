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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Megaphone className="w-6 h-6 mr-2 text-primary-500" />
            Create Announcement
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-dark-700 rounded-lg border-l-4 border-primary-500">
            <p className="text-sm text-dark-300 mb-2">
              This will create an announcement from the selected message and notify all group members.
            </p>
            <div className="flex items-center space-x-2 text-xs text-dark-400">
              <Megaphone className="w-4 h-4" />
              <span>Announcement will appear in the group's announcements tab</span>
            </div>
          </div>

          <div className="bg-dark-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
            <ul className="text-xs text-dark-300 space-y-1">
              <li>• Push notifications to all group members</li>
              <li>• Message saved to announcements tab</li>
              <li>• Highlighted in chat with announcement badge</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAnnouncement}
              className="flex-1 btn-primary flex items-center justify-center"
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
