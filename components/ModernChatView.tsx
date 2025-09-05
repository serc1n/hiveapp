'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Send, MoreVertical, Hash, Users, Sparkles } from 'lucide-react'
import { ModernMessageList } from './ModernMessageList'
import { GroupSettingsModal } from './GroupSettingsModal'
import { AISummaryModal } from './AISummaryModal'
import { AnnouncementModal } from './AnnouncementModal'

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

interface Group {
  id: string
  name: string
  profileImage: string | null
  memberCount: number
  isCreator?: boolean
  creatorId?: string
  contractAddress: string | null
  requiresApproval?: boolean
  createdAt?: string
  updatedAt?: string
}

interface ModernChatViewProps {
  groupId: string
  onBack?: () => void
  isMobile?: boolean
}

export function ModernChatView({ groupId, onBack, isMobile = false }: ModernChatViewProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showGroupSettings, setShowGroupSettings] = useState(false)
  const [showAISummary, setShowAISummary] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [selectedMessageForAnnouncement, setSelectedMessageForAnnouncement] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (groupId) {
      fetchGroupData()
      fetchMessages(true)
      
      // Set up polling for new messages
      const messageInterval = setInterval(() => {
        if (!document.hidden) {
          fetchMessages(false)
        }
      }, 3000)
      
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchMessages(false)
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        clearInterval(messageInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [groupId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchGroupData = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setGroup(data.group)
        const userIsMember = data.group.members?.some((member: any) => member.id === session?.user?.id) || data.group.isCreator
        setIsMember(userIsMember)
      }
    } catch (error) {
      console.error('Error fetching group data:', error)
    }
  }

  const fetchMessages = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      const response = await fetch(`/api/groups/${groupId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(prevMessages => {
          if (prevMessages.length !== data.messages.length || 
              (data.messages.length > 0 && prevMessages.length > 0 && 
               data.messages[data.messages.length - 1].id !== prevMessages[prevMessages.length - 1].id)) {
            return data.messages
          }
          return prevMessages
        })
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
      } else {
        setNewMessage(messageContent)
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(messageContent)
      alert('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleMakeAnnouncement = (messageId: string) => {
    setSelectedMessageForAnnouncement(messageId)
    setShowAnnouncementModal(true)
  }

  const handleAnnouncementCreated = () => {
    setShowAnnouncementModal(false)
    setSelectedMessageForAnnouncement(null)
    // Refresh messages to show announcement status
    fetchMessages(false)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Hash className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Group not found</h3>
          <p className="text-gray-600">This group doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
              {group.profileImage ? (
                <img
                  src={group.profileImage}
                  alt={group.name}
                  className="w-10 h-10 rounded-2xl object-cover"
                />
              ) : (
                <Hash className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{group.name}</h2>
              <p className="text-sm text-gray-600 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {group.memberCount} members
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          
          {(group.isCreator || isMember) && (
            <>
              <button
                onClick={() => setShowAISummary(true)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                title="AI Summary"
              >
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </button>
              
              <button
                onClick={() => setShowGroupSettings(true)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                title="Group settings"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        <ModernMessageList
          messages={messages}
          currentUserId={session?.user?.id}
          currentUserImage={session?.user?.image}
          onMakeAnnouncement={handleMakeAnnouncement}
          isGroupOwner={group.isCreator}
          groupCreatorId={group.creatorId}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white safe-area-pb">
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${group.name}...`}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                disabled={isSending}
                maxLength={1000}
              />
              <div className="absolute right-3 bottom-2 text-xs text-gray-400">
                {newMessage.length}/1000
              </div>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="w-12 h-12 bg-gradient-primary hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modals */}
      {showGroupSettings && group && (
        <GroupSettingsModal
          group={group}
          onClose={() => setShowGroupSettings(false)}
          onGroupUpdated={() => {
            fetchGroupData()
            setShowGroupSettings(false)
          }}
        />
      )}

      {showAISummary && group && (
        <AISummaryModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowAISummary(false)}
        />
      )}

      {showAnnouncementModal && selectedMessageForAnnouncement && (
        <AnnouncementModal
          messageId={selectedMessageForAnnouncement}
          groupId={groupId}
          onClose={() => {
            setShowAnnouncementModal(false)
            setSelectedMessageForAnnouncement(null)
          }}
          onAnnouncementCreated={handleAnnouncementCreated}
        />
      )}
    </div>
  )
}
