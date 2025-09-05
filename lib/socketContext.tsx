'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface SocketContextType {
  isConnected: boolean
  joinGroups: (groupIds: string[]) => void
  leaveGroups: (groupIds: string[]) => void
  onMessageReceived: (callback: (data: any) => void) => void
  offMessageReceived: () => void
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  joinGroups: () => {},
  leaveGroups: () => {},
  onMessageReceived: () => {},
  offMessageReceived: () => {},
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messageCallback, setMessageCallback] = useState<((data: any) => void) | null>(null)
  const [channels, setChannels] = useState<RealtimeChannel[]>([])
  const { data: session } = useSession()

  // Supabase Realtime connection
  useEffect(() => {
    if (!session?.user) return

    console.log('🔌 Setting up Supabase Realtime connection')
    setIsConnected(true) // Assume connected for now, will be validated when subscribing

    return () => {
      console.log('🔌 Cleaning up Supabase Realtime connection')
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      setChannels([])
    }
  }, [session, channels])

  const joinGroups = useCallback((groupIds: string[]) => {
    if (!session?.user) {
      console.log('🔌 No session, skipping group join')
      return
    }

    console.log('🔌 Joining groups via Supabase Realtime:', groupIds)

    // Remove existing channels
    channels.forEach(channel => {
      console.log('🔌 Removing existing channel')
      supabase.removeChannel(channel)
    })

    // Create new channels for each group
    const newChannels = groupIds.map(groupId => {
      console.log(`🔌 Creating channel for group: ${groupId}`)
      const channel = supabase
        .channel(`messages_${groupId}`) // Simpler channel name
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages', // Using the actual table name from @@map
            filter: `groupId=eq.${groupId}`
          },
          async (payload: any) => {
            console.log('🔌 RAW Supabase Realtime payload:', JSON.stringify(payload, null, 2))
            
            if (messageCallback && payload.new && payload.new.userId !== session.user.id) {
              console.log('🔌 Processing message from user:', payload.new.userId, 'current user:', session.user.id)
              
              // Fetch user data for the message
              try {
                const userResponse = await fetch(`/api/users/${payload.new.userId}`)
                const user = userResponse.ok ? await userResponse.json() : null
                
                console.log('🔌 Fetched user data:', user)
                
                const messageData = {
                  groupId: payload.new.groupId,
                  message: {
                    id: payload.new.id,
                    content: payload.new.content,
                    userId: payload.new.userId,
                    createdAt: payload.new.createdAt,
                    user
                  }
                }
                
                console.log('🔌 Calling messageCallback with:', messageData)
                messageCallback(messageData)
              } catch (error) {
                console.error('🔌 Error fetching user data for message:', error)
                // Still send the message without user data
                const messageData = {
                  groupId: payload.new.groupId,
                  message: {
                    id: payload.new.id,
                    content: payload.new.content,
                    userId: payload.new.userId,
                    createdAt: payload.new.createdAt,
                    user: null
                  }
                }
                console.log('🔌 Calling messageCallback with fallback data:', messageData)
                messageCallback(messageData)
              }
            } else {
              console.log('🔌 Message ignored - no callback, no payload.new, or from current user')
            }
          }
        )
        .subscribe((status) => {
          console.log(`🔌 Channel ${groupId} subscription status:`, status)
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Successfully subscribed to group ${groupId}`)
            setIsConnected(true)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log(`❌ Channel error for group ${groupId}:`, status)
            setIsConnected(false)
          }
        })

      return channel
    })

    setChannels(newChannels)
    console.log(`🔌 Created ${newChannels.length} channels`)
  }, [session, messageCallback, channels])

  const leaveGroups = useCallback((groupIds: string[]) => {
    console.log('🔌 Leaving groups:', groupIds)
    
    channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
    setChannels([])
  }, [channels])

  const onMessageReceived = useCallback((callback: (data: any) => void) => {
    console.log('🔌 Setting message callback')
    setMessageCallback(() => callback)
  }, [])

  const offMessageReceived = useCallback(() => {
    console.log('🔌 Removing message callback')
    setMessageCallback(null)
  }, [])

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        joinGroups,
        leaveGroups,
        onMessageReceived,
        offMessageReceived,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
