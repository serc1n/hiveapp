'use client'

import { useState, useEffect } from 'react'
import { MoreHorizontal, Megaphone, User, MessageCircle, Bell, Smile, Plus } from 'lucide-react'
import { useSocket } from '../lib/socketContext'
import { HiveLogo } from './HiveLogo'
import { Tweet } from 'react-tweet'

// Helper function to detect Twitter/X URLs and extract tweet ID
const extractTweetId = (url: string) => {
  const twitterRegex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/
  const match = url.match(twitterRegex)
  return match ? match[1] : null
}

// Compact Twitter embed component using react-tweet
const RichTwitterEmbed = ({ tweetId }: { tweetId: string, url: string }) => {
  return (
    <div className="my-1 max-w-xs transform scale-75 origin-top-left -mb-4">
      <div className="compact-tweet">
        <Tweet id={tweetId} />
      </div>
    </div>
  )
}

// Emoji picker component
const EmojiPicker = ({ onEmojiSelect, position, messageId }: { 
  onEmojiSelect: (emoji: string) => void, 
  position: 'left' | 'right',
  messageId: string
}) => {
  const COMMON_EMOJIS = ['❤️', '💯', '😂', '👍']
  
  return (
    <div className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 ${
      position === 'right' ? 'right-0' : 'left-0'
    }`}>
      <div className="flex gap-0.5">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-sm transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

// Render message content with URL detection and rich embeds
const renderMessageContent = (content: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = content.split(urlRegex)
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Check if it's a Twitter/X link
      const tweetId = extractTweetId(part)
      if (tweetId) {
        return <RichTwitterEmbed key={index} tweetId={tweetId} url={part} />
      }
      
      const isInstagramLink = part.includes('instagram.com')
      
      return (
        <a 
          key={index}
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {isInstagramLink ? '📸 Instagram Post' : part}
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
}

interface Reaction {
  id: string
  emoji: string
  userId: string
  user: {
    id: string
    name: string
    twitterHandle: string
  }
  users: Array<{
    id: string
    name: string
    twitterHandle: string
  }>
  userReacted: boolean
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
  reactions?: Reaction[]
  createdAt: string
}

interface ModernMessageListProps {
  messages: Message[]
  currentUserId?: string
  currentUserImage?: string | null
  onMakeAnnouncement?: (messageId: string) => void
  isGroupOwner?: boolean
  groupCreatorId?: string
  onMessagesUpdate?: () => void
}

export function ModernMessageList({ 
  messages, 
  currentUserId = '', 
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner, 
  groupCreatorId, 
  onMessagesUpdate 
}: ModernMessageListProps) {
  const { onReaction, offReaction } = useSocket()
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)

  // Sync with parent messages
  useEffect(() => {
    setLocalMessages(messages)
  }, [messages])

  // Listen for real-time reaction updates
  useEffect(() => {
    const handleReactionUpdate = (data: any) => {
      console.log('🔄 Real-time reaction update:', data)
      
      setLocalMessages(prevMessages => 
        prevMessages.map(message => {
          if (message.id === data.messageId) {
            const currentReactions = message.reactions || []
            
            if (data.eventType === 'INSERT') {
              // Add new reaction
              const existingReactionIndex = currentReactions.findIndex(r => r.emoji === data.emoji)
              
              if (existingReactionIndex >= 0) {
                // Update existing reaction
                const updatedReactions = [...currentReactions]
                updatedReactions[existingReactionIndex] = {
                  ...updatedReactions[existingReactionIndex],
                  users: [...(updatedReactions[existingReactionIndex].users || []), {
                    id: data.userId,
                    name: data.user?.name || 'User',
                    twitterHandle: data.user?.twitterHandle || ''
                  }],
                  userReacted: updatedReactions[existingReactionIndex].userReacted || data.userId === currentUserId
                }
                return { ...message, reactions: updatedReactions }
              } else {
                // Add new reaction type
                return {
                  ...message,
                  reactions: [
                    ...currentReactions,
                    {
                      id: data.id,
                      emoji: data.emoji,
                      userId: data.userId,
                      user: data.user || { id: data.userId, name: 'User', twitterHandle: '' },
                      users: [{ 
                        id: data.userId, 
                        name: data.user?.name || 'User', 
                        twitterHandle: data.user?.twitterHandle || '' 
                      }],
                      userReacted: data.userId === currentUserId
                    }
                  ]
                }
              }
            } else if (data.eventType === 'DELETE') {
              // Remove reaction
              const updatedReactions = currentReactions.map(reaction => {
                if (reaction.emoji === data.emoji) {
                  const updatedUsers = reaction.users.filter(user => user.id !== data.userId)
                  return {
                    ...reaction,
                    users: updatedUsers,
                    userReacted: reaction.userReacted && data.userId !== currentUserId
                  }
                }
                return reaction
              }).filter(reaction => reaction.users.length > 0)
              
              return { ...message, reactions: updatedReactions }
            }
          }
          return message
        })
      )
    }

    onReaction(handleReactionUpdate)

    return () => {
      offReaction()
    }
  }, [onReaction, offReaction, currentUserId])

  const handleEmojiReaction = async (messageId: string, emoji: string) => {
    try {
      // Optimistic update
      setLocalMessages(prevMessages => 
        prevMessages.map(message => {
          if (message.id === messageId) {
            const currentReactions = message.reactions || []
            const existingReactionIndex = currentReactions.findIndex(r => r.emoji === emoji)
            
            if (existingReactionIndex >= 0) {
              const existingReaction = currentReactions[existingReactionIndex]
              const userAlreadyReacted = existingReaction.users.some(user => user.id === currentUserId)
              
              if (userAlreadyReacted) {
                // Remove user's reaction
                const updatedUsers = existingReaction.users.filter(user => user.id !== currentUserId)
                const updatedReactions = [...currentReactions]
                
                if (updatedUsers.length === 0) {
                  // Remove reaction entirely if no users left
                  updatedReactions.splice(existingReactionIndex, 1)
                } else {
                  updatedReactions[existingReactionIndex] = {
                    ...existingReaction,
                    users: updatedUsers,
                    userReacted: false
                  }
                }
                
                return { ...message, reactions: updatedReactions }
              } else {
                // Add user's reaction
                const updatedReactions = [...currentReactions]
                updatedReactions[existingReactionIndex] = {
                  ...existingReaction,
                  users: [...existingReaction.users, {
                    id: currentUserId,
                    name: 'You',
                    twitterHandle: ''
                  }],
                  userReacted: true
                }
                return { ...message, reactions: updatedReactions }
              }
            } else {
              // Add new reaction
              return {
                ...message,
                reactions: [
                  ...currentReactions,
                  {
                    id: `temp-${Date.now()}`,
                    emoji,
                    userId: currentUserId,
                    user: { id: currentUserId, name: 'You', twitterHandle: '' },
                    users: [{ id: currentUserId, name: 'You', twitterHandle: '' }],
                    userReacted: true
                  }
                ]
              }
            }
          }
          return message
        })
      )

      // Make API call
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      })

      if (!response.ok) {
        throw new Error('Failed to update reaction')
      }

      // Trigger parent refresh if provided
      if (onMessagesUpdate) {
        onMessagesUpdate()
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
      // Revert optimistic update on error
      setLocalMessages(messages)
    }
  }

  if (localMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <HiveLogo className="w-full h-full" />
          </div>
          <p className="text-gray-500 text-lg mb-2">No messages yet</p>
          <p className="text-gray-400 text-sm">Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {localMessages.map((message, index) => {
        const isOwn = message.userId === currentUserId
        const showAvatar = !isOwn && (index === 0 || localMessages[index - 1].userId !== message.userId)
        const showName = !isOwn && (index === 0 || localMessages[index - 1].userId !== message.userId)
        
        // Process reactions to group by emoji
        const processedReactions = (message.reactions || []).reduce((acc: any, reaction: any) => {
          const existingReaction = acc.find((r: any) => r.emoji === reaction.emoji)
          if (existingReaction) {
            existingReaction.count += 1
            existingReaction.users.push(reaction.user)
            if (reaction.userId === currentUserId) {
              existingReaction.userReacted = true
            }
          } else {
            acc.push({
              emoji: reaction.emoji,
              count: 1,
              users: [reaction.user],
              userReacted: reaction.userId === currentUserId
            })
          }
          return acc
        }, [])

        return (
          <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
            <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
              {/* Avatar */}
              {showAvatar && (
                <div className="flex-shrink-0 w-8 h-8">
                  {message.user.profileImage ? (
                    <img
                      src={message.user.profileImage}
                      alt={message.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/default-avatar.png'
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Message container */}
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Sender name - only for others when showing avatar */}
                {showName && (
                  <span className="text-xs text-gray-500 mb-1 px-3">
                    {message.user.name}
                  </span>
                )}
                
                {/* Message bubble with reactions */}
                <div className="relative">
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      isOwn
                        ? 'bg-gradient-primary text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {renderMessageContent(message.content)}
                    </div>
                    
                    {/* Reaction button */}
                    <button
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                      className={`absolute -bottom-2 ${isOwn ? '-left-2' : '-right-2'} w-6 h-6 rounded-full border-2 ${
                        isOwn ? 'border-white bg-gray-100' : 'border-gray-200 bg-white'
                      } flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50`}
                    >
                      <Smile className="w-3 h-3 text-gray-500" />
                    </button>
                    
                    {/* Emoji picker */}
                    {showEmojiPicker === message.id && (
                      <EmojiPicker
                        onEmojiSelect={(emoji) => {
                          handleEmojiReaction(message.id, emoji)
                          setShowEmojiPicker(null)
                        }}
                        position={isOwn ? 'right' : 'left'}
                        messageId={message.id}
                      />
                    )}
                  </div>
                  
                  {/* Reactions display */}
                  {processedReactions.length > 0 && (
                    <div className={`flex flex-wrap gap-0.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {processedReactions.map((reaction: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => handleEmojiReaction(message.id, reaction.emoji)}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                            reaction.userReacted
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                          title={`${reaction.users.map((u: any) => u.name).join(', ')} reacted with ${reaction.emoji}`}
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
