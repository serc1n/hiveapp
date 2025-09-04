'use client'

import { ChatMessage } from './ChatMessage'

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

interface SimpleChatListProps {
  messages: Message[]
  currentUserId?: string
  currentUserImage?: string
  onMakeAnnouncement: (messageId: string) => void
  isGroupOwner?: boolean
}

export function SimpleChatList({ 
  messages, 
  currentUserId, 
  currentUserImage, 
  onMakeAnnouncement, 
  isGroupOwner 
}: SimpleChatListProps) {
  
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

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            💬
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
          <p className="text-gray-400">Be the first to start the conversation!</p>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
        <div key={dateKey} className="mb-6">
          {/* Date separator */}
          <div className="flex justify-center mb-4">
            <div className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
              {formatDate(dateMessages[0].createdAt)}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-0.5">
            {dateMessages.map((message, index) => {
              const isOwn = message.userId === currentUserId
              const showAvatar = index === 0 || dateMessages[index - 1].userId !== message.userId

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
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
  )
}
