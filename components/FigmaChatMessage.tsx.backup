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

interface FigmaChatMessageProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  showName: boolean
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
}

export function FigmaChatMessage({ 
  message, 
  isOwn, 
  showAvatar, 
  showName,
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner 
}: FigmaChatMessageProps) {
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
    <div className={`flex mb-4 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-3 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Avatar - only for others */}
        {!isOwn && (
          <div className={`w-10 h-10 ${showAvatar ? 'visible' : 'invisible'}`}>
            {showAvatar && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 p-0.5">
                <img
                  src={message.user.profileImage || '/default-avatar.png'}
                  alt={message.user.name}
                  className="w-full h-full rounded-full object-cover bg-gray-800"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/default-avatar.png'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Message container */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name - only for others when showing avatar */}
          {!isOwn && showName && (
            <div className="text-sm font-medium text-gray-300 mb-2 px-1">
              {message.user.name}
            </div>
          )}

          {/* Message bubble */}
          <div className="relative">
            <div
              className={`px-4 py-3 rounded-2xl relative ${
                isOwn
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm shadow-lg'
                  : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
              }`}
              style={{ 
                maxWidth: 'fit-content',
                minWidth: '60px'
              }}
            >
              {/* Message text */}
              <div className="text-sm leading-relaxed break-words whitespace-pre-wrap font-medium">
                {message.content}
              </div>
              
              {/* Time stamp - positioned at bottom right of bubble */}
              <div className={`text-xs mt-2 ${
                isOwn ? 'text-blue-100' : 'text-gray-400'
              } text-right opacity-75`}>
                {formatTime(message.createdAt)}
              </div>
            </div>

            {/* Message tail */}
            <div 
              className={`absolute bottom-0 w-4 h-4 ${
                isOwn 
                  ? 'right-0 bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'left-0 bg-gray-800 border-l border-b border-gray-700'
              }`}
              style={{
                clipPath: isOwn 
                  ? 'polygon(0 0, 100% 0, 0 100%)' 
                  : 'polygon(0 0, 100% 100%, 100% 0)'
              }}
            />

            {/* Admin menu */}
            {isGroupOwner && (
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-8 h-8 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center shadow-xl border border-gray-600 transition-all duration-200"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                  </button>

                  {showDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(false)}
                      />
                      
                      {/* Dropdown menu */}
                      <div className="absolute right-0 top-10 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl z-20 min-w-[180px] py-2 backdrop-blur-sm">
                        <button
                          onClick={() => {
                            onMakeAnnouncement(message.id)
                            setShowDropdown(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-100 hover:bg-gray-800 transition-colors flex items-center font-medium"
                        >
                          <Megaphone className="w-4 h-4 mr-3 text-blue-400" />
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
