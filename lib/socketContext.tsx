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
  onGroupDeleted: (callback: (data: any) => void) => void
  offGroupDeleted: () => void
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  joinGroups: () => {},
  leaveGroups: () => {},
  onMessageReceived: () => {},
  offMessageReceived: () => {},
  onGroupDeleted: () => {},
  offGroupDeleted: () => {},
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
  const [groupDeletedCallback, setGroupDeletedCallback] = useState<((data: any) => void) | null>(null)
  const [channels, setChannels] = useState<RealtimeChannel[]>([])
  const [currentGroupIds, setCurrentGroupIds] = useState<string[]>([])
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
    if (!session?.user) {
      console.log('🔌 Cannot join groups - no session')
      return
    }

    console.log('🔌 Setting up Supabase Realtime channel')
    console.log('🔌 Groups to monitor:', groupIds)
    
    // Store current group IDs
    setCurrentGroupIds(groupIds)

    // Remove existing channels
    channels.forEach(channel => {
      console.log('🔌 Removing existing channel')
      supabase.removeChannel(channel)
    })

    // Create a single channel for both messages and group deletions
    const channel = supabase
      .channel('hive_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload: any) => {
          console.log('🔌 ===== REALTIME MESSAGE RECEIVED =====')
          console.log('🔌 Full payload:', JSON.stringify(payload, null, 2))
          console.log('🔌 Message data:', payload.new)
          console.log('🔌 Current user ID:', session.user.id)
          console.log('🔌 Message user ID:', payload.new?.userId)
          console.log('🔌 Message group ID:', payload.new?.groupId)
          console.log('🔌 Current groups:', currentGroupIds)
          console.log('🔌 Is in groups?', payload.new ? currentGroupIds.includes(payload.new.groupId) : false)
          
          // Process ALL messages for now (for debugging)
          if (payload.new) {
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
              // Use the current messageCallback from state
              if (messageCallback) {
                messageCallback(messageData)
              } else {
                console.log('🔌 No messageCallback available!')
              }
            } catch (error) {
              console.error('🔌 Error processing message:', error)
            }
          } else {
            console.log('🔌 No payload.new data!')
          }
          console.log('🔌 =====================================')
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'groups'
        },
        async (payload: any) => {
          console.log('🔌 ===== REALTIME GROUP DELETED =====')
          console.log('🔌 Group deletion payload:', JSON.stringify(payload, null, 2))
          console.log('🔌 Deleted group data:', payload.old)
          
          if (payload.old && groupDeletedCallback) {
            console.log('🔌 Processing group deletion:', payload.old.id)
            const groupDeletedData = {
              groupId: payload.old.id,
              groupName: payload.old.name
            }
            
            console.log('🔌 Calling groupDeletedCallback with:', groupDeletedData)
            groupDeletedCallback(groupDeletedData)
          } else {
            console.log('🔌 No group deletion callback available or no payload data!')
          }
          console.log('🔌 ===================================')
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
  }, [session?.user?.id, currentGroupIds, messageCallback, groupDeletedCallback]) // Include dependencies for proper closure

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

  const onGroupDeleted = useCallback((callback: (data: any) => void) => {
    console.log('🔌 Setting group deleted callback')
    setGroupDeletedCallback(() => callback)
  }, [])

  const offGroupDeleted = useCallback(() => {
    console.log('🔌 Removing group deleted callback')
    setGroupDeletedCallback(null)
  }, [])

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        joinGroups,
        leaveGroups,
        onMessageReceived,
        offMessageReceived,
        onGroupDeleted,
        offGroupDeleted,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
