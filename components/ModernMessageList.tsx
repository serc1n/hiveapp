'use client'

import { useState, useEffect } from 'react'
import { MoreHorizontal, Megaphone, User, MessageCircle, Bell, Smile, Plus } from 'lucide-react'
import { useSocket } from '../lib/socketContext'
import { HiveLogo } from './HiveLogo'

// Helper function to detect Twitter/X URLs and extract tweet ID
const extractTweetId = (url: string) => {
  const twitterRegex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/
  const match = url.match(twitterRegex)
  return match ? match[1] : null
}

  // Compact Twitter card component - authentic style but smaller
  const CompactTwitterCard = ({ tweetId, url }: { tweetId: string, url: string }) => {
    const [tweetData, setTweetData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const fetchTweetData = async () => {
        try {
          const response = await fetch(`/api/twitter/oembed?url=${encodeURIComponent(url)}`)
          if (response.ok) {
            const data = await response.json()
            
            // Extract images from the HTML if available
            let mediaUrl = data.meta_image
            if (!mediaUrl && data.html) {
              const parser = new DOMParser()
              const doc = parser.parseFromString(data.html, 'text/html')
              const imgs = doc.querySelectorAll('img')
              for (let i = 0; i < imgs.length; i++) {
                const img = imgs[i]
                if (img.src && !img.src.includes('profile_images') && !img.src.includes('avatar')) {
                  // Convert to larger size if it's a Twitter image
                  let imgSrc = img.src
                  if (imgSrc.includes('pbs.twimg.com')) {
                    imgSrc = imgSrc.replace(/(\?.*)?$/, '?format=jpg&name=small')
                  }
                  mediaUrl = imgSrc
                  break
                }
              }
            }

            // Extract clean tweet text from HTML, preserving line breaks
            let tweetText = data.meta_description || ''
            if (!tweetText && data.html) {
              const parser = new DOMParser()
              const doc = parser.parseFromString(data.html, 'text/html')
              const textElement = doc.querySelector('.tweet-text') || doc.querySelector('p')
              if (textElement) {
                tweetText = textElement.textContent || (textElement as HTMLElement).innerText || ''
              } else {
                // Fallback: extract text from HTML
                tweetText = data.html
                  .replace(/<[^>]*>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .replace(/pic\.twitter\.com\/\w+/g, '')
                  .replace(/https?:\/\/[^\s]+/g, '')
                  .trim()
              }
            }

            // Get proper display name and username
            const displayName = data.twitter_display_name || data.author_name || ''
            const username = data.twitter_creator?.replace('@', '') || data.author_name || ''
            
            // Get profile image
            const profileImage = data.twitter_profile_image || 
                               `https://unavatar.io/twitter/${username}` ||
                               `https://unavatar.io/twitter/${data.author_name}`

            const processedData = {
              ...data,
              display_name: displayName,
              username: username,
              profile_image: profileImage,
              tweet_text: tweetText,
              media_url: mediaUrl,
              has_media: !!mediaUrl
            }

            console.log('🐦 Processed Twitter data:', {
              display_name: displayName,
              username: username,
              tweet_text: tweetText.substring(0, 100) + '...',
              has_media: !!mediaUrl,
              profile_image: profileImage
            })

            setTweetData(processedData)
          } else {
            // Fallback: extract basic info from URL
            const match = url.match(/twitter\.com\/([^/]+)\/status\/(\d+)/)
            if (match) {
              setTweetData({
                display_name: match[1],
                username: match[1],
                tweet_text: 'Check out this tweet',
                profile_image: `https://unavatar.io/twitter/${match[1]}`,
                url: url
              })
            }
          }
        } catch (error) {
          console.error('Error fetching tweet:', error)
          // Fallback for any error
          const match = url.match(/twitter\.com\/([^/]+)\/status\/(\d+)/)
          if (match) {
            setTweetData({
              display_name: match[1],
              username: match[1],
              tweet_text: 'Check out this tweet',
              profile_image: `https://unavatar.io/twitter/${match[1]}`,
              url: url
            })
          }
        } finally {
          setLoading(false)
        }
      }

      fetchTweetData()
    }, [url])

    if (loading) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 my-2 max-w-sm animate-pulse">
          <div className="flex items-start space-x-2">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              <div className="h-2 bg-gray-300 rounded w-3/4"></div>
              <div className="h-2 bg-gray-300 rounded w-1/2"></div>
              <div className="h-20 bg-gray-300 rounded-lg w-full"></div>
            </div>
          </div>
        </div>
      )
    }

    if (!tweetData) return null

    return (
      <div 
        className="bg-gray-50 border border-gray-200 rounded-xl p-3 my-2 max-w-sm hover:bg-gray-100 transition-colors cursor-pointer"
        onClick={() => window.open(url, '_blank')}
      >
        <div className="flex items-start space-x-3">
          {/* Profile Image */}
          <img
            src={tweetData.profile_image}
            alt={tweetData.display_name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `https://unavatar.io/twitter/${tweetData.username}`
            }}
          />
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-1 mb-1">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {tweetData.display_name}
              </span>
              {tweetData.verified && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-2.5-1.67c-.331-.221-.419-.67-.196-1.001.221-.331.669-.419 1.001-.196l1.896 1.265 3.751-5.627c.253-.38.76-.484 1.14-.231.381.253.484.759.231 1.14z"/>
                </svg>
              )}
              <span className="text-gray-500 text-sm truncate">
                @{tweetData.username}
              </span>
              <span className="text-gray-400 text-sm">·</span>
              <div className="text-gray-400 text-sm flex items-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </div>
            </div>
            
            {/* Tweet Content - with proper line breaks */}
            <div className="text-gray-800 text-sm leading-relaxed mb-3 whitespace-pre-line">
              {tweetData.tweet_text}
            </div>
            
            {/* Media Preview */}
            {tweetData.has_media && tweetData.media_url && (
              <div className="rounded-lg overflow-hidden mb-3 border border-gray-200">
                <img
                  src={tweetData.media_url}
                  alt="Tweet media"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
            
            {/* Footer */}
            <div className="flex items-center text-gray-400 text-xs">
              <span>View on</span>
              <svg className="w-3 h-3 mx-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </div>
          </div>
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
        return <CompactTwitterCard key={index} tweetId={tweetId} url={part} />
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
    <div className="flex-1 overflow-y-auto p-4">
      {localMessages.map((message, index) => {
        const isOwn = message.userId === currentUserId
        const showAvatar = !isOwn && (index === 0 || localMessages[index - 1].userId !== message.userId)
        const showName = !isOwn && (index === 0 || localMessages[index - 1].userId !== message.userId)
        const isConsecutive = index > 0 && localMessages[index - 1].userId === message.userId
        
        // Process reactions to group by emoji
        const processedReactions = (message.reactions || []).reduce((acc: any, reaction: any) => {
          const existingReaction = acc.find((r: any) => r.emoji === reaction.emoji)
          if (existingReaction) {
            existingReaction.count += 1
            existingReaction.users.push(reaction.user || { id: reaction.userId, name: 'User', twitterHandle: '' })
            if (reaction.userId === currentUserId) {
              existingReaction.userReacted = true
            }
          } else {
            acc.push({
              emoji: reaction.emoji,
              count: 1,
              users: [reaction.user || { id: reaction.userId, name: 'User', twitterHandle: '' }],
              userReacted: reaction.userId === currentUserId
            })
          }
          return acc
        }, [])

        return (
          <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
            <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'items-end' : 'items-start'} space-x-2`}>
              {/* Avatar - only show for other users */}
              {!isOwn && (
                <div className="flex-shrink-0 w-8 h-8">
                  {showAvatar ? (
                    message.user?.profileImage ? (
                      <img
                        src={message.user.profileImage}
                        alt={message.user?.name || 'User'}
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
                    )
                  ) : (
                    // Empty space to maintain alignment for consecutive messages
                    <div className="w-8 h-8"></div>
                  )}
                </div>
              )}
              
              {/* Message container */}
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} flex-1`}>
                {/* Message bubble with reactions */}
                <div className="relative">
                  <div
                    className={`px-4 py-2 rounded-2xl shadow-sm max-w-xs ${
                      isOwn
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-white'
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
                          title={`${reaction.users.map((u: any) => u?.name || 'User').join(', ')} reacted with ${reaction.emoji}`}
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Username and timestamp below message - only for first message from sender */}
                {showName && (
                  <div className="text-xs text-gray-400 mt-1 px-1">
                    <span className="font-medium text-gray-300">{message.user?.name || 'User'}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
