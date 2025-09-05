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
    
    // Listen for connection status
    supabase.realtime.onOpen(() => {
      console.log('🔌 Supabase Realtime connected')
      setIsConnected(true)
    })

    supabase.realtime.onClose(() => {
      console.log('🔌 Supabase Realtime disconnected')
      setIsConnected(false)
    })

    supabase.realtime.onError((error) => {
      console.error('🔌 Supabase Realtime error:', error)
      setIsConnected(false)
    })

    return () => {
      console.log('🔌 Cleaning up Supabase Realtime connection')
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      setChannels([])
    }
  }, [session])

  const joinGroups = useCallback((groupIds: string[]) => {
    if (!session?.user) return

    console.log('🔌 Joining groups via Supabase Realtime:', groupIds)

    // Remove existing channels
    channels.forEach(channel => {
      supabase.removeChannel(channel)
    })

    // Create new channels for each group
    const newChannels = groupIds.map(groupId => {
      const channel = supabase
        .channel(`messages:groupId=eq.${groupId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages', // Using the actual table name from @@map
            filter: `groupId=eq.${groupId}`
          },
          async (payload: any) => {
            console.log('🔌 Received new message via Supabase Realtime:', payload)
            
            if (messageCallback && payload.new && payload.new.userId !== session.user.id) {
              // Fetch user data for the message
              try {
                const userResponse = await fetch(`/api/users/${payload.new.userId}`)
                const user = userResponse.ok ? await userResponse.json() : null
                
                messageCallback({
                  groupId: payload.new.groupId,
                  message: {
                    id: payload.new.id,
                    content: payload.new.content,
                    userId: payload.new.userId,
                    createdAt: payload.new.createdAt,
                    user
                  }
                })
              } catch (error) {
                console.error('🔌 Error fetching user data for message:', error)
                // Still send the message without user data
                messageCallback({
                  groupId: payload.new.groupId,
                  message: {
                    id: payload.new.id,
                    content: payload.new.content,
                    userId: payload.new.userId,
                    createdAt: payload.new.createdAt,
                    user: null
                  }
                })
              }
            }
          }
        )
        .subscribe((status) => {
          console.log(`🔌 Channel ${groupId} subscription status:`, status)
        })

      return channel
    })

    setChannels(newChannels)
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
