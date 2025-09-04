'use client'

import { FigmaChatMessage } from './FigmaChatMessage'

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

interface FigmaChatListProps {
  messages: Message[]
  currentUserId?: string
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
}

export function FigmaChatList({ 
  messages, 
  currentUserId, 
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner 
}: FigmaChatListProps) {
  
  const formatDateSeparator = (dateString: string) => {
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

  const shouldShowAvatar = (messages: Message[], index: number, currentUserId?: string) => {
    const message = messages[index]
    const isOwn = message.userId === currentUserId
    
    if (isOwn) return false
    
    // Show avatar if it's the first message or if the previous message is from a different user
    return index === 0 || messages[index - 1].userId !== message.userId
  }

  const shouldShowName = (messages: Message[], index: number, currentUserId?: string) => {
    return shouldShowAvatar(messages, index, currentUserId)
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          {/* Modern empty state with gradient */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <div className="text-4xl">💬</div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Start the conversation
          </h3>
          <p className="text-gray-400 leading-relaxed text-lg">
            Send your first message and bring this community to life!
          </p>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Chat background pattern */}
      <div className="relative">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="relative px-4 py-8 space-y-12">
          {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
            <div key={dateKey}>
              {/* Enhanced date separator */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full shadow-lg border border-gray-600">
                    <span className="text-sm font-semibold text-gray-200 tracking-wide">
                      {formatDateSeparator(dateMessages[0].createdAt)}
                    </span>
                  </div>
                  {/* Decorative dots */}
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-60" />
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full opacity-60" />
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                {dateMessages.map((message, index) => {
                  const isOwn = message.userId === currentUserId
                  const showAvatar = shouldShowAvatar(dateMessages, index, currentUserId)
                  const showName = shouldShowName(dateMessages, index, currentUserId)

                  return (
                    <FigmaChatMessage
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showName={showName}
                      currentUserImage={currentUserImage}
                      onMakeAnnouncement={onMakeAnnouncement}
                      isGroupOwner={isGroupOwner}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
