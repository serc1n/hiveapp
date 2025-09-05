'use client'

import { useState } from 'react'
import { MoreHorizontal, Megaphone, User, MessageCircle } from 'lucide-react'

// Helper function to detect Twitter/X URLs and extract tweet ID
const extractTweetId = (url: string) => {
  const twitterRegex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/
  const match = url.match(twitterRegex)
  return match ? match[1] : null
}

// Helper component for Twitter embed
const TwitterEmbed = ({ tweetId, url }: { tweetId: string, url: string }) => {
  return (
    <div className="my-2 p-3 border border-gray-200 rounded-xl bg-gray-50 max-w-lg">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
          <span className="text-white text-xs font-bold">𝕏</span>
        </div>
        <span className="text-sm font-medium text-gray-700">Twitter Post</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        View this post on X (formerly Twitter)
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        <span>𝕏</span>
        <span>View Post</span>
      </a>
    </div>
  )
}

// Helper function to detect and make links clickable with previews
const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      // Check if it's a Twitter/X link
      const tweetId = extractTweetId(part)
      if (tweetId) {
        return <TwitterEmbed key={index} tweetId={tweetId} url={part} />
      }
      
      const isInstagramLink = part.includes('instagram.com')
      const isTikTokLink = part.includes('tiktok.com')
      
      let displayText = part
      let linkClass = "text-blue-600 hover:text-blue-800 underline break-all"
      let emoji = "🔗"
      
      if (isInstagramLink) {
        displayText = "📷 Instagram"
        linkClass = "inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors text-sm font-medium no-underline"
        emoji = "📷"
      } else if (isTikTokLink) {
        displayText = "🎵 TikTok"
        linkClass = "inline-flex items-center space-x-1 px-2 py-1 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium no-underline"
        emoji = "🎵"
      }
      
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={(e) => e.stopPropagation()}
          title={part}
        >
          <span>{emoji}</span>
          <span>{displayText}</span>
        </a>
      )
    }
    return part
  })
}

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

interface ModernMessageListProps {
  messages: Message[]
  currentUserId?: string
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
  groupCreatorId?: string
}

export function ModernMessageList({ 
  messages, 
  currentUserId, 
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner,
  groupCreatorId 
}: ModernMessageListProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
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
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
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

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="text-4xl">👋</div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Start the conversation</h3>
          <p className="text-gray-600 leading-relaxed">
            Send your first message to get this conversation started!
          </p>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="p-4 space-y-6">
      {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
        <div key={dateKey} className="animate-slide-in">
          {/* Date separator */}
          <div className="flex justify-center mb-6">
            <div className="px-4 py-2 bg-white rounded-full shadow-card border border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                {formatDate(dateMessages[0].createdAt)}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {dateMessages.map((message, index) => {
              const isOwn = message.userId === currentUserId
              const showAvatar = index === 0 || dateMessages[index - 1].userId !== message.userId
              const showName = !isOwn && showAvatar

              return (
                <div
                  key={message.id}
                  className={`flex group ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`flex items-start space-x-2 max-w-[75%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar for others */}
                    {!isOwn && (
                      <div className={`w-6 h-6 mt-1 ${showAvatar ? 'visible' : 'invisible'}`}>
                        {showAvatar && (
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-primary">
                            {message.user.profileImage ? (
                              <img
                                src={message.user.profileImage}
                                alt={message.user.name}
                                className="w-6 h-6 object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 flex items-center justify-center">
                                <User className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message container */}
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      {/* Sender name */}
                      {showName && (
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {message.user.name}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className="relative">
                        <div
                          className={`px-2 py-1 rounded-lg relative ${
                            isOwn
                              ? 'bg-green-500 text-black rounded-br-sm'
                              : groupCreatorId && message.userId === groupCreatorId
                              ? 'bg-purple-600 text-white border border-purple-300 rounded-bl-sm shadow-sm'
                              : 'bg-white text-black border border-gray-200 rounded-bl-sm shadow-sm'
                          }`}
                          style={{ 
                            maxWidth: 'fit-content',
                            minWidth: '40px'
                          }}
                        >
                          {/* Message text with inline timestamp */}
                          <div className={`text-sm leading-normal break-words whitespace-pre-wrap ${
                            groupCreatorId && message.userId === groupCreatorId ? 'text-white' : 'text-black'
                          }`}>
                            {linkifyText(message.content)}
                            <span className={`text-xs font-normal ml-2 select-none ${
                              groupCreatorId && message.userId === groupCreatorId ? 'text-purple-100' : 'text-gray-400'
                            }`} style={{ fontSize: '10px' }}>
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Admin menu */}
                        {isGroupOwner && (
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="relative">
                              <button
                                onClick={() => setActiveDropdown(activeDropdown === message.id ? null : message.id)}
                                className="w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-modern border border-gray-200 transition-all duration-200"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-600" />
                              </button>

                              {activeDropdown === message.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setActiveDropdown(null)}
                                  />
                                  
                                  <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-modern z-20 min-w-[180px] py-2">
                                    <button
                                      onClick={() => {
                                        onMakeAnnouncement(message.id)
                                        setActiveDropdown(null)
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center font-medium"
                                    >
                                      <Megaphone className="w-4 h-4 mr-3 text-indigo-600" />
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
  )
}
