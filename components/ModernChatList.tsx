'use client'

import { ModernChatMessage } from './ModernChatMessage'

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

interface ModernChatListProps {
  messages: Message[]
  currentUserId?: string
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
}

export function ModernChatList({ 
  messages, 
  currentUserId, 
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner 
}: ModernChatListProps) {
  
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

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-6 space-y-8">
        {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            {/* Date separator */}
            <div className="flex justify-center mb-6">
              <div className="px-4 py-2 bg-gray-800 rounded-full shadow-sm">
                <span className="text-xs font-medium text-gray-300">
                  {formatDateSeparator(dateMessages[0].createdAt)}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-1">
              {dateMessages.map((message, index) => {
                const isOwn = message.userId === currentUserId
                const showAvatar = shouldShowAvatar(dateMessages, index, currentUserId)
                const showName = shouldShowName(dateMessages, index, currentUserId)

                return (
                  <ModernChatMessage
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
  )
}
