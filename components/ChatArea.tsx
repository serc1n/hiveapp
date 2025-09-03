'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Hash, Users, Bell, BellOff, MoreVertical } from 'lucide-react'
import { MessageList } from './MessageList'
import { AnnouncementModal } from './AnnouncementModal'
import { GroupSettingsModal } from './GroupSettingsModal'

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
  contractAddress: string | null
  memberCount: number
  isCreator?: boolean
}

interface ChatAreaProps {
  groupId: string
}

export function ChatArea({ groupId }: ChatAreaProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [selectedMessageForAnnouncement, setSelectedMessageForAnnouncement] = useState<string | null>(null)
  const [showGroupSettings, setShowGroupSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (groupId) {
      fetchGroupData()
      fetchMessages()
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
      }
    } catch (error) {
      console.error('Error fetching group data:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/groups/${groupId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
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
        // Restore message if failed
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
    fetchMessages()
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-dark-400">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Hash className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Group not found</h3>
          <p className="text-dark-400">This group doesn't exist or you don't have access.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-700 bg-dark-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-dark-600 rounded-lg flex items-center justify-center">
                {group.profileImage ? (
                  <img
                    src={group.profileImage}
                    alt={group.name}
                    className="w-10 h-10 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement!
                      parent.innerHTML = '<svg class="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>'
                    }}
                  />
                ) : (
                  <Hash className="w-5 h-5 text-dark-400" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-white">{group.name}</h2>
                <div className="flex items-center space-x-2 text-sm text-dark-400">
                  <Users className="w-4 h-4" />
                  <span>{group.memberCount} members</span>
                  {group.contractAddress && (
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      Token Gated
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowGroupSettings(true)}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              title="Group Settings"
            >
              <MoreVertical className="w-5 h-5 text-dark-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <MessageList 
            messages={messages} 
            currentUserId={session?.user?.id}
            currentUserImage={session?.user?.image}
            onMakeAnnouncement={handleMakeAnnouncement}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-dark-700 bg-dark-800">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${group.name}`}
              className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSending}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Announcement Modal */}
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

      {/* Group Settings Modal */}
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
    </>
  )
}
