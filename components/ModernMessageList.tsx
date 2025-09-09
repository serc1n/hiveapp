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

// Twitter embed data interface
interface TwitterEmbedData {
  author_name: string
  author_url: string
  author_profile_image_url?: string
  text?: string
  created_at?: string
  public_metrics?: {
    like_count: number
    reply_count: number
    retweet_count: number
  }
  media?: Array<{
    type: string
    url: string
    preview_image_url?: string
  }>
  verified?: boolean
}

// Rich Twitter embed component
const RichTwitterEmbed = ({ tweetId, url }: { tweetId: string, url: string }) => {
  const [tweetData, setTweetData] = useState<TwitterEmbedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchTweetData = async () => {
      try {
        setLoading(true)
        setError(false)
        
        // Use Twitter oEmbed API
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&hide_thread=true&theme=light&maxwidth=500&omit_script=true`
        
        const response = await fetch(`/api/twitter/oembed?url=${encodeURIComponent(oembedUrl)}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch tweet data')
        }
        
        const data = await response.json()
        
        // Parse the HTML to extract tweet information
        const parser = new DOMParser()
        const doc = parser.parseFromString(data.html, 'text/html')
        
        // Extract tweet text with proper formatting (preserve line breaks)
        const tweetElement = doc.querySelector('p')
        let tweetText = ''
        if (tweetElement) {
          // Get innerHTML and convert <br> tags to newlines
          const innerHTML = tweetElement.innerHTML
          tweetText = innerHTML
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '') // Remove other HTML tags
            .trim()
        }
        
        // Extract username from author_url (more reliable than author_name)
        const authorName = data.author_name || 'Twitter User'
        const authorUrl = data.author_url || url
        
        // Extract username from URL like https://twitter.com/serc1n
        let username = authorName
        if (authorUrl) {
          const urlMatch = authorUrl.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)
          if (urlMatch && urlMatch[1]) {
            username = urlMatch[1]
          }
        }
        
        // Try to extract profile image from the HTML
        let profileImageUrl = `https://unavatar.io/twitter/${username}`
        
        // Look for Twitter profile images in the HTML
        const imgElements = doc.querySelectorAll('img')
        for (let i = 0; i < imgElements.length; i++) {
          const imgElement = imgElements[i]
          const imgSrc = imgElement.getAttribute('src')
          if (imgSrc && (
            imgSrc.includes('twimg.com/profile_images') || 
            imgSrc.includes('pbs.twimg.com/profile_images')
          )) {
            profileImageUrl = imgSrc
            break
          }
        }
        
        // If no profile image found in HTML, try alternative services
        if (!profileImageUrl.includes('twimg.com')) {
          // Try multiple avatar services as fallbacks
          const avatarServices = [
            `https://unavatar.io/twitter/${username}`,
            `https://avatars.githubusercontent.com/${username}?size=48`,
            `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=48&background=1da1f2&color=fff`
          ]
          profileImageUrl = avatarServices[0] // Use unavatar as primary
        }
        
        console.log('🐦 Extracted tweet data:', {
          authorName,
          username,
          authorUrl,
          tweetText: tweetText.substring(0, 100) + '...',
          profileImageUrl
        })
        
        setTweetData({
          author_name: `@${username}`,
          author_url: authorUrl,
          text: tweetText,
          author_profile_image_url: profileImageUrl,
          public_metrics: {
            like_count: Math.floor(Math.random() * 1000), // Placeholder
            reply_count: Math.floor(Math.random() * 100),
            retweet_count: Math.floor(Math.random() * 200)
          },
          verified: Math.random() > 0.7 // Random verification for demo
        })
      } catch (err) {
        console.error('Error fetching tweet data:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchTweetData()
  }, [tweetId, url])

  if (loading) {
    return (
      <div className="my-3 p-4 border border-gray-200 rounded-xl bg-white max-w-md animate-pulse">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error || !tweetData) {
    return (
      <div className="my-3 p-4 border border-gray-200 rounded-xl bg-gray-50 max-w-md">
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

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="my-3 border border-gray-200 rounded-xl bg-white max-w-md shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header with author info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={tweetData.author_profile_image_url || '/default-avatar.png'}
                alt={tweetData.author_name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/default-avatar.png'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <h3 className="font-bold text-gray-900 text-sm truncate">
                  {tweetData.author_name.startsWith('@') ? tweetData.author_name.substring(1) : tweetData.author_name}
                </h3>
                {tweetData.verified && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500 fill-current">
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                  </svg>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                {tweetData.author_name.startsWith('@') ? tweetData.author_name : `@${tweetData.author_name}`}
              </p>
            </div>
          </div>
          
          {/* Twitter logo */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>

        {/* Tweet content */}
        {tweetData.text && (
          <div className="mb-4">
            <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
              {tweetData.text}
            </p>
          </div>
        )}

        {/* Media placeholder */}
        {tweetData.media && tweetData.media.length > 0 && (
          <div className="mb-4 bg-gray-100 rounded-lg h-48 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Media content</span>
          </div>
        )}

        {/* Timestamp */}
        <div className="mb-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 text-sm hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {tweetData.created_at ? formatTime(tweetData.created_at) : 'View on X'}
          </a>
        </div>

        {/* Engagement metrics */}
        {tweetData.public_metrics && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              {/* Reply */}
              <a
                href={`https://twitter.com/intent/tweet?in_reply_to=${tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current group-hover:fill-blue-500">
                  <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/>
                </svg>
                <span className="text-sm">{formatCount(tweetData.public_metrics.reply_count)}</span>
              </a>

              {/* Retweet */}
              <a
                href={`https://twitter.com/intent/retweet?tweet_id=${tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current group-hover:fill-green-500">
                  <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.791-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.791 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                </svg>
                <span className="text-sm">{formatCount(tweetData.public_metrics.retweet_count)}</span>
              </a>

              {/* Like */}
              <a
                href={`https://twitter.com/intent/like?tweet_id=${tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current group-hover:fill-red-500">
                  <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
                </svg>
                <span className="text-sm">{formatCount(tweetData.public_metrics.like_count)}</span>
              </a>
            </div>

            {/* Share button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(url)
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              title="Copy link"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05 8.46 5.64l1.42-1.42c2.73-2.73 7.16-2.73 9.9 0 2.73 2.74 2.73 7.17 0 9.9l-1.42 1.42-1.41-1.42 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-12.02.71l1.42-1.42 1.41 1.42-1.41 1.41c-1.96 1.96-1.96 5.12 0 7.07 1.95 1.96 5.11 1.96 7.07 0l1.41-1.41 1.42 1.41-1.42 1.42c-2.73 2.73-7.16 2.73-9.9 0-2.73-2.74-2.73-7.17 0-9.9z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
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
        return <RichTwitterEmbed key={index} tweetId={tweetId} url={part} />
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

interface Reaction {
  emoji: string
  count: number
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
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
  groupCreatorId?: string
  onMessagesUpdate?: () => void
}

export function ModernMessageList({ 
  messages, 
  currentUserId, 
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner, 
  groupCreatorId,
  onMessagesUpdate
}: ModernMessageListProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showingUsername, setShowingUsername] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [localMessages, setLocalMessages] = useState<Message[]>(messages)
  const { onReaction, offReaction } = useSocket()

  // Sync local messages with prop messages
  useEffect(() => {
    setLocalMessages(messages)
  }, [messages])

  // Listen for real-time reaction updates
  useEffect(() => {
    const handleReactionUpdate = (data: any) => {
      console.log('📱 Real-time reaction received:', data)
      
      // Update local messages with the reaction change
      setLocalMessages(prevMessages => 
        prevMessages.map(message => {
          if (message.id !== data.messageId) return message
          
          const existingReactions = message.reactions || []
          
          if (data.eventType === 'INSERT') {
            // Add or update reaction
            const existingReaction = existingReactions.find(r => r.emoji === data.emoji)
            
            if (existingReaction) {
              // Update existing reaction count
              return {
                ...message,
                reactions: existingReactions.map(r => 
                  r.emoji === data.emoji 
                    ? { 
                        ...r, 
                        count: r.count + 1,
                        userReacted: data.userId === currentUserId ? true : r.userReacted
                      }
                    : r
                )
              }
            } else {
              // Add new reaction
              return {
                ...message,
                reactions: [
                  ...existingReactions,
                  { 
                    emoji: data.emoji, 
                    count: 1, 
                    users: [], 
                    userReacted: data.userId === currentUserId 
                  }
                ]
              }
            }
          } else if (data.eventType === 'DELETE') {
            // Remove or decrease reaction
            const existingReaction = existingReactions.find(r => r.emoji === data.emoji)
            
            if (existingReaction) {
              if (existingReaction.count === 1) {
                // Remove the entire reaction
                return {
                  ...message,
                  reactions: existingReactions.filter(r => r.emoji !== data.emoji)
                }
              } else {
                // Decrease count
                return {
                  ...message,
                  reactions: existingReactions.map(r => 
                    r.emoji === data.emoji 
                      ? { 
                          ...r, 
                          count: r.count - 1,
                          userReacted: data.userId === currentUserId ? false : r.userReacted
                        }
                      : r
                  )
                }
              }
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

  if (localMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <HiveLogo className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Start the conversation</h3>
          <p className="text-gray-600 leading-relaxed">
            Send your first message to get this conversation started!
          </p>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(localMessages)

  const handleEmojiReaction = async (messageId: string, emoji: string) => {
    // Optimistic update - update local state immediately
    setLocalMessages(prevMessages => 
      prevMessages.map(message => {
        if (message.id !== messageId) return message
        
        const existingReactions = message.reactions || []
        const existingReaction = existingReactions.find(r => r.emoji === emoji)
        
        if (existingReaction) {
          if (existingReaction.userReacted) {
            // Remove user's reaction
            if (existingReaction.count === 1) {
              // Remove the entire reaction if count becomes 0
              return {
                ...message,
                reactions: existingReactions.filter(r => r.emoji !== emoji)
              }
            } else {
              // Decrease count and set userReacted to false
              return {
                ...message,
                reactions: existingReactions.map(r => 
                  r.emoji === emoji 
                    ? { ...r, count: r.count - 1, userReacted: false }
                    : r
                )
              }
            }
          } else {
            // Add user's reaction to existing emoji
            return {
              ...message,
              reactions: existingReactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.count + 1, userReacted: true }
                  : r
              )
            }
          }
        } else {
          // Add new reaction
          return {
            ...message,
            reactions: [
              ...existingReactions,
              { emoji, count: 1, users: [], userReacted: true }
            ]
          }
        }
      })
    )

    // Then sync with server
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        console.log('Reaction updated successfully')
        // Refresh messages from server to ensure consistency
        if (onMessagesUpdate) {
          onMessagesUpdate()
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to update reaction:', errorData)
        
        // Revert optimistic update on error
        setLocalMessages(messages)
        
        if (response.status === 503) {
          console.log('Reactions temporarily unavailable:', errorData.details)
        }
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
      // Revert optimistic update on error
      setLocalMessages(messages)
    }
  }

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
          <div>
            {dateMessages.map((message, index) => {
              const isOwn = message.userId === currentUserId
              const showAvatar = index === 0 || dateMessages[index - 1].userId !== message.userId
              const showName = !isOwn && showAvatar
              const isConsecutive = index > 0 && dateMessages[index - 1].userId === message.userId

              return (
                <div
                  key={message.id}
                  className={`flex group ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in ${
                    isConsecutive ? 'mt-0.5' : 'mt-2'
                  }`}
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
                              ? 'rounded-br-sm'
                              : 'bg-white text-black border border-gray-200 rounded-bl-sm shadow-sm'
                          }`}
                          style={{ 
                            maxWidth: 'fit-content',
                            minWidth: '40px',
                            backgroundColor: isOwn ? '#dddddd' : undefined
                          }}
                        >
                          {/* Message text with inline timestamp */}
                          <div className={`text-sm leading-normal break-words whitespace-pre-wrap ${
                            isOwn ? 'text-black' : 'text-black'
                          }`}>
                            {linkifyText(message.content)}
                            <span className={`text-xs font-normal ml-2 select-none ${
                              isOwn ? 'text-gray-600' : 'text-gray-400'
                            }`} style={{ fontSize: '10px' }}>
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Reactions and Add reaction button - only show if reactions exist */}
                        {((message.reactions && message.reactions.length > 0) || showEmojiPicker === message.id) && (
                          <div className="flex flex-wrap items-center gap-0.5 mt-1">
                            {/* Existing reactions */}
                            {message.reactions && message.reactions.length > 0 && (
                              message.reactions.map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  onClick={() => handleEmojiReaction(message.id, reaction.emoji)}
                                  className={`inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                                    reaction.userReacted
                                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <span className="text-xs">{reaction.emoji}</span>
                                  <span className="text-xs">{reaction.count}</span>
                                </button>
                              ))
                            )}
                            
                            {/* Add reaction button */}
                            <div className="relative">
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <span className="text-xs">😀</span>
                              </button>
                              {showEmojiPicker === message.id && (
                                <EmojiPicker
                                  onEmojiSelect={(emoji) => handleEmojiReaction(message.id, emoji)}
                                  onClose={() => setShowEmojiPicker(null)}
                                  isOwnMessage={isOwn}
                                />
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Show add reaction button on hover even when no reactions exist */}
                        {!(message.reactions && message.reactions.length > 0) && showEmojiPicker !== message.id && (
                          <div className="relative mt-1">
                            <button
                              onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <span className="text-xs">😀</span>
                            </button>
                          </div>
                        )}

                        {/* Admin menu */}
                        {isGroupOwner && (
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="relative">
                              <button
                                onClick={() => setActiveDropdown(activeDropdown === message.id ? null : message.id)}
                                className="w-6 h-6 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all duration-200"
                              >
                                {activeDropdown === message.id ? (
                                  <Bell className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <MoreHorizontal className="w-3 h-3 text-gray-600" />
                                )}
                              </button>

                              {activeDropdown === message.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setActiveDropdown(null)}
                                  />
                                  
                                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-modern z-20 min-w-[140px] py-1">
                                    <button
                                      onClick={() => {
                                        onMakeAnnouncement(message.id)
                                        setActiveDropdown(null)
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center font-medium"
                                    >
                                      <Megaphone className="w-3 h-3 mr-2 text-indigo-600" />
                                      Announce
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

// Common emoji reactions
const COMMON_EMOJIS = ['❤️', '💯', '😂', '👍']

// Emoji picker component
const EmojiPicker = ({ 
  onEmojiSelect, 
  onClose,
  isOwnMessage = false
}: { 
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
  isOwnMessage?: boolean
}) => {
  return (
    <div className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 z-10 ${
      isOwnMessage ? 'right-0' : 'left-0'
    }`}>
      <div className="flex gap-0.5">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji)
              onClose()
            }}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-sm flex items-center justify-center w-7 h-7"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
