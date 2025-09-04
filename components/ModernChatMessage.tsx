'use client'

import { useState } from 'react'
import { MoreHorizontal, Megaphone } from 'lucide-react'

interface Message {
  id: string
  content: string
  userId: string
  user: {
    name: string
    twitterHandle: string
    profileImage: string | null
  }
  createdAt: string
}

interface ModernChatMessageProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  showName: boolean
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
}

export function ModernChatMessage({ 
  message, 
  isOwn, 
  showAvatar, 
  showName,
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner 
}: ModernChatMessageProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <div className={`flex mb-2 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end space-x-2 max-w-[80%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar - only for others and when needed */}
        {!isOwn && (
          <div className={`w-8 h-8 ${showAvatar ? 'visible' : 'invisible'}`}>
            {showAvatar && (
              <img
                src={message.user.profileImage || '/default-avatar.png'}
                alt={message.user.name}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/default-avatar.png'
                }}
              />
            )}
          </div>
        )}

        {/* Message container */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name - only for others when showing avatar */}
          {!isOwn && showName && (
            <span className="text-xs text-gray-400 mb-1 px-1">
              {message.user.name}
            </span>
          )}

          {/* Message bubble */}
          <div className="relative">
            <div
              className={`px-4 py-2 rounded-2xl shadow-sm ${
                isOwn
                  ? 'bg-white text-gray-900 rounded-br-md'
                  : 'bg-gray-800 text-white rounded-bl-md'
              }`}
              style={{ 
                maxWidth: 'fit-content',
                minWidth: '48px'
              }}
            >
              {/* Message text */}
              <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                {message.content}
              </div>
              
              {/* Time stamp */}
              <div className={`text-xs mt-1 ${
                isOwn ? 'text-gray-500' : 'text-gray-400'
              } text-right`}>
                {formatTime(message.createdAt)}
              </div>
            </div>

            {/* Admin menu */}
            {isGroupOwner && (
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-6 h-6 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <MoreHorizontal className="w-3 h-3 text-gray-300" />
                  </button>

                  {showDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(false)}
                      />
                      
                      {/* Dropdown menu */}
                      <div className="absolute right-0 top-7 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 min-w-[160px] py-1">
                        <button
                          onClick={() => {
                            onMakeAnnouncement(message.id)
                            setShowDropdown(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 transition-colors flex items-center"
                        >
                          <Megaphone className="w-4 h-4 mr-2 text-gray-400" />
                          Make Announcement
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
