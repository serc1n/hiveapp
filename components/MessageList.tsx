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

interface MessageListProps {
  messages: Message[]
  currentUserId?: string
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
}

export function MessageList({ messages, currentUserId, currentUserImage, onMakeAnnouncement, isGroupOwner }: MessageListProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const dateKey = new Date(message.createdAt).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="text-3xl">💬</div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">No messages yet</h3>
          <p className="text-gray-400 leading-relaxed">
            Start the conversation! Send the first message to get things going.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-6 space-y-8">
        {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="flex justify-center mb-6">
              <div className="px-4 py-2 bg-gray-800 rounded-full shadow-sm">
                <span className="text-xs font-medium text-gray-300">
                  {formatDate(dateMessages[0].createdAt)}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-1">
              {dateMessages.map((message, index) => {
                const isOwn = message.userId === currentUserId
                const showAvatar = !isOwn && (index === 0 || dateMessages[index - 1].userId !== message.userId)
                const showName = showAvatar

                return (
                  <div key={message.id} className={`flex mb-2 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
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
                                  onClick={() => setActiveDropdown(activeDropdown === message.id ? null : message.id)}
                                  className="w-6 h-6 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center shadow-lg transition-colors"
                                >
                                  <MoreHorizontal className="w-3 h-3 text-gray-300" />
                                </button>

                                {activeDropdown === message.id && (
                                  <>
                                    {/* Backdrop */}
                                    <div 
                                      className="fixed inset-0 z-10" 
                                      onClick={() => setActiveDropdown(null)}
                                    />
                                    
                                    {/* Dropdown menu */}
                                    <div className="absolute right-0 top-7 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 min-w-[160px] py-1">
                                      <button
                                        onClick={() => {
                                          onMakeAnnouncement(message.id)
                                          setActiveDropdown(null)
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
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}