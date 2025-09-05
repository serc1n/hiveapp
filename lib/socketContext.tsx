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

  // Supabase Realtime connection cleanup
  useEffect(() => {
    return () => {
      console.log('🔌 Cleaning up Supabase Realtime connection')
      // Clean up all channels on unmount
      setChannels(prevChannels => {
        prevChannels.forEach(channel => {
          supabase.removeChannel(channel)
        })
        return []
      })
    }
  }, [])

  const joinGroups = useCallback((groupIds: string[]) => {
    if (!session?.user || !messageCallback) {
      console.log('🔌 Cannot join groups - no session or messageCallback')
      return
    }

    console.log('🔌 Setting up Supabase Realtime channel')
    console.log('🔌 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔌 Groups to monitor:', groupIds)

    // Remove existing channels
    channels.forEach(channel => {
      console.log('🔌 Removing existing channel')
      supabase.removeChannel(channel)
    })

    // Create a single channel for all messages
    const channel = supabase
      .channel('hive_messages', {
        config: {
          broadcast: { self: false },
          presence: { key: session.user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload: any) => {
          console.log('🔌 Realtime payload received:', {
            event: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old
          })
          
          // Only process if user is not the sender and groupId is in our groups
          if (payload.new && payload.new.userId !== session.user.id && groupIds.includes(payload.new.groupId)) {
            console.log('🔌 Processing message for group:', payload.new.groupId)
            try {
              const userResponse = await fetch(`/api/users/${payload.new.userId}`)
              const user = userResponse.ok ? await userResponse.json() : null
              
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
              console.error('🔌 Error processing message:', error)
            }
          } else {
            console.log('🔌 Message ignored:', {
              hasNew: !!payload.new,
              isFromSelf: payload.new?.userId === session.user.id,
              isInGroups: payload.new ? groupIds.includes(payload.new.groupId) : false
            })
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 Realtime subscription status:', status)
        if (err) {
          console.error('🔌 Realtime subscription error:', err)
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to Realtime!')
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('❌ Realtime connection failed:', status)
          setIsConnected(false)
        }
      })

    setChannels([channel])
    console.log('🔌 Channel created and subscribed')
  }, [session, messageCallback])

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
