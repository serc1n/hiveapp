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
}

export function MessageList({ messages, currentUserId, currentUserImage, onMakeAnnouncement }: MessageListProps) {
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
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          💬
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
        <p className="text-dark-400">Be the first to start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          {/* Date Separator */}
          <div className="flex items-center justify-center mb-4">
            <div className="px-3 py-1 bg-dark-700 rounded-full text-xs text-dark-300">
              {formatDate(dateMessages[0].createdAt)}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-3">
            {dateMessages.map((message, index) => {
              const isOwn = message.userId === currentUserId
              const showAvatar = index === 0 || dateMessages[index - 1].userId !== message.userId

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 ${showAvatar ? 'visible' : 'invisible'}`}>
                      <img
                        src={
                          isOwn 
                            ? (currentUserImage || '/default-avatar.png')
                            : (message.user.profileImage || '/default-avatar.png')
                        }
                        alt={isOwn ? 'You' : message.user.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-dark-600"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/default-avatar.png'
                        }}
                      />
                    </div>

                    {/* Message Bubble */}
                    <div className="relative">
                      {showAvatar && !isOwn && (
                        <div className="mb-1">
                          <span className="text-xs font-medium text-white">
                            {message.user.name}
                          </span>
                          <span className="text-xs text-dark-400 ml-2">
                            @{message.user.twitterHandle}
                          </span>
                        </div>
                      )}

                      <div
                        className={`message-bubble ${
                          isOwn ? 'message-own' : 'message-other'
                        } relative`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>

                        {/* Message Actions */}
                        {currentUserId && (
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="relative">
                              <button
                                onClick={() => setActiveDropdown(activeDropdown === message.id ? null : message.id)}
                                className="p-1 bg-dark-700 hover:bg-dark-600 rounded-full shadow-lg"
                              >
                                <MoreHorizontal className="w-4 h-4 text-dark-300" />
                              </button>

                              {/* Dropdown Menu */}
                              {activeDropdown === message.id && (
                                <div className="absolute right-0 top-8 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-10 min-w-[150px]">
                                  <button
                                    onClick={() => {
                                      onMakeAnnouncement(message.id)
                                      setActiveDropdown(null)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-dark-600 rounded-lg flex items-center"
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

                      <div className={`text-xs text-dark-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.createdAt)}
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
  )
}
