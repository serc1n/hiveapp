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

interface ChatMessageProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
}

export function ChatMessage({ 
  message, 
  isOwn, 
  showAvatar, 
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner 
}: ChatMessageProps) {
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
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[70%]`}>
        {/* Avatar for others only */}
        {!isOwn && (
          <div className={`w-8 h-8 mr-2 flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
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

        {/* Message bubble */}
        <div className="relative">
          {/* Name for others - show only with avatar */}
          {!isOwn && showAvatar && (
            <div className="text-xs text-gray-400 mb-1 ml-3">
              {message.user.name}
            </div>
          )}

          {/* Message content */}
          <div
            className={`px-3 py-2 rounded-2xl relative inline-block ${
              isOwn
                ? 'bg-white text-black rounded-br-sm'
                : 'bg-gray-700 text-white rounded-bl-sm'
            }`}
          >
            <div className="text-sm break-words whitespace-pre-wrap">
              {message.content}
            </div>
            
            {/* Time - inside bubble for own messages */}
            <div className={`text-xs mt-1 ${
              isOwn 
                ? 'text-gray-500 text-right' 
                : 'text-gray-400 text-left'
            }`}>
              {formatTime(message.createdAt)}
            </div>
          </div>

          {/* Admin actions */}
          {isGroupOwner && (
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                    <button
                      onClick={() => {
                        onMakeAnnouncement(message.id)
                        setShowDropdown(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 rounded-lg flex items-center"
                    >
                      <Megaphone className="w-4 h-4 mr-2" />
                      Make Announcement
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
