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
      return
    }

    console.log('🔌 Setting up single Realtime channel for all messages')

    // Remove existing channels
    channels.forEach(channel => {
      supabase.removeChannel(channel)
    })

    // Create a single channel for all messages
    const channel = supabase
      .channel('all_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload: any) => {
          console.log('🔌 New message received:', payload.new)
          
          // Only process if user is not the sender and groupId is in our groups
          if (payload.new && payload.new.userId !== session.user.id && groupIds.includes(payload.new.groupId)) {
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
              console.error('Error fetching user data:', error)
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime channel status:', status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
        }
      })

    setChannels([channel])
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
