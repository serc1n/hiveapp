'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Send, Hash, Users, Bell, BellOff, MoreVertical, UserPlus, UserMinus, Sparkles } from 'lucide-react'
import { FigmaChatList } from './FigmaChatList'
import { AnnouncementModal } from './AnnouncementModal'
import { GroupSettingsModal } from './GroupSettingsModal'
import { MembersListModal } from './MembersListModal'
import { AISummaryModal } from './AISummaryModal'
import { getImageUrl } from '@/lib/imageUpload'

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

interface Member {
  id: string
  name: string
  twitterHandle: string
  profileImage: string | null
  joinedAt: string
}

interface Group {
  id: string
  name: string
  profileImage: string | null
  contractAddress: string | null
  memberCount: number
  isCreator?: boolean
  members?: Member[]
}

interface ChatAreaProps {
  groupId: string
  onBack?: () => void
}

export function ChatArea({ groupId, onBack }: ChatAreaProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Temporary debug - remove this later
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [selectedMessageForAnnouncement, setSelectedMessageForAnnouncement] = useState<string | null>(null)
  const [showGroupSettings, setShowGroupSettings] = useState(false)
  const [showMembersList, setShowMembersList] = useState(false)
  const [showAISummary, setShowAISummary] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (groupId) {
      fetchGroupData()
      fetchMessages(true) // Show loading on initial fetch
      
      // Set up polling for new messages every 3 seconds
      const messageInterval = setInterval(() => {
        // Only poll if page is visible
        if (!document.hidden) {
          fetchMessages(false) // Don't show loading on polling
        }
      }, 3000)
      
      // Also fetch when page becomes visible again
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
        // Check if current user is a member
        const userIsMember = data.group.members?.some((member: Member) => member.id === session?.user?.id) || data.group.isCreator
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
        // Only update if messages have changed (compare length and last message)
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

  const handleJoinGroup = async () => {
    if (!group || isJoining) return
    
    setIsJoining(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      })

      if (response.ok) {
        setIsMember(true)
        // Refresh group data to get updated member count and list
        await fetchGroupData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join group')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!group || isLeaving || group.isCreator) return
    
    if (!confirm('Are you sure you want to leave this group?')) return
    
    setIsLeaving(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIsMember(false)
        // Redirect to home since user is no longer a member
        router.push('/')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to leave group')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      alert('Failed to leave group')
    } finally {
      setIsLeaving(false)
    }
  }

  const handleAnnouncementCreated = () => {
    setShowAnnouncementModal(false)
    setSelectedMessageForAnnouncement(null)
    // Refresh messages to show announcement status
    fetchMessages(false)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <Hash className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Group not found</h3>
          <p className="text-gray-400">This group doesn't exist or you don't have access.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col w-full" style={{ height: '100dvh' }}>
              {/* Enhanced Header - Desktop Only */}
              <div className="hidden sm:flex items-center justify-between p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex-shrink-0 shadow-lg">
                <div className="flex items-center space-x-4">
                  {group?.profileImage ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 p-0.5">
                      <img
                        src={getImageUrl(group.profileImage, 'group')}
                        alt={group.name}
                        className="w-full h-full rounded-full object-cover bg-gray-800"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Hash className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{group?.name}</h2>
                    <p className="text-sm text-gray-300 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {group?.memberCount} members
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* AI Summary Button */}
                  {(group?.isCreator || isMember) && (
                    <button
                      onClick={() => setShowAISummary(true)}
                      className="p-3 hover:bg-gray-700 rounded-xl transition-all duration-200 bg-gray-800 border border-gray-600 shadow-md hover:shadow-lg"
                      title="AI Summary"
                    >
                      <Sparkles className="w-5 h-5 text-blue-400" />
                    </button>
                  )}
                  
                  {/* Group Settings */}
                  {(group?.isCreator || isMember) && (
                    <button
                      onClick={() => setShowGroupSettings(true)}
                      className="p-3 hover:bg-gray-700 rounded-xl transition-all duration-200 bg-gray-800 border border-gray-600 shadow-md hover:shadow-lg"
                      title="Group Settings"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-300" />
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Mobile Header */}
              <div className="sm:hidden flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex-shrink-0 shadow-lg">
                <div className="flex items-center space-x-3">
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200 bg-gray-800 border border-gray-600"
                      title="Back to hives"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {group?.profileImage ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 p-0.5">
                      <img
                        src={getImageUrl(group.profileImage, 'group')}
                        alt={group.name}
                        className="w-full h-full rounded-full object-cover bg-gray-800"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Hash className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold text-white">{group?.name}</h2>
                    <p className="text-xs text-gray-300">{group?.memberCount} members</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* AI Summary Button */}
                  {(group?.isCreator || isMember) && (
                    <button
                      onClick={() => setShowAISummary(true)}
                      className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200 bg-gray-800 border border-gray-600"
                      title="AI Summary"
                    >
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    </button>
                  )}
                  
                  {/* Group Settings */}
                  {(group?.isCreator || isMember) && (
                    <button
                      onClick={() => setShowGroupSettings(true)}
                      className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200 bg-gray-800 border border-gray-600"
                      title="Group Settings"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-300" />
                    </button>
                  )}
                </div>
              </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col bg-black w-full">
          <FigmaChatList 
            messages={messages} 
            currentUserId={session?.user?.id}
            currentUserImage={session?.user?.image}
            onMakeAnnouncement={handleMakeAnnouncement}
            isGroupOwner={group.isCreator}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Message Input - Figma Style */}
        <div className="flex-shrink-0 bg-gradient-to-t from-gray-900 to-gray-800 w-full border-t border-gray-700" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSendMessage} className="flex space-x-4 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Type your message...`}
                  className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 shadow-lg"
                  disabled={isSending}
                  maxLength={1000}
                />
                {/* Character count */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {newMessage.length}/1000
                </div>
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white transition-all duration-200 flex items-center justify-center rounded-2xl shadow-lg transform hover:scale-105 active:scale-95"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
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

      {showGroupSettings && group && (
        <GroupSettingsModal
          group={group}
          onClose={() => setShowGroupSettings(false)}
          onGroupUpdated={() => {
            fetchGroupData()
            setShowGroupSettings(false)
          }}
          onGroupDeleted={() => {
            setShowGroupSettings(false)
            // Navigate back to main view
            if (onBack) {
              onBack()
            }
          }}
        />
      )}

      {showMembersList && group && group.members && (
        <MembersListModal
          members={group.members}
          groupName={group.name}
          onClose={() => setShowMembersList(false)}
        />
      )}

      {showAISummary && group && (
        <AISummaryModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowAISummary(false)}
        />
      )}
    </>
  )
}
