'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinGroups: (groupIds: string[]) => void
  leaveGroups: (groupIds: string[]) => void
  emitNewMessage: (data: any) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGroups: () => {},
  leaveGroups: () => {},
  emitNewMessage: () => {},
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
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      // Initialize socket connection
      const socketInstance = io(process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000', {
        path: '/api/socket',
        addTrailingSlash: false,
      })

      socketInstance.on('connect', () => {
        console.log('🔌 WebSocket connected:', socketInstance.id)
        setIsConnected(true)
      })

      socketInstance.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected')
        setIsConnected(false)
      })

      socketInstance.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error)
        setIsConnected(false)
      })

      setSocket(socketInstance)

      return () => {
        console.log('🔌 Cleaning up WebSocket connection')
        socketInstance.disconnect()
      }
    }
  }, [session])

  const joinGroups = (groupIds: string[]) => {
    if (socket && isConnected) {
      socket.emit('join-groups', groupIds)
      console.log('🔌 Joined groups:', groupIds)
    }
  }

  const leaveGroups = (groupIds: string[]) => {
    if (socket && isConnected) {
      socket.emit('leave-groups', groupIds)
      console.log('🔌 Left groups:', groupIds)
    }
  }

  const emitNewMessage = (data: any) => {
    if (socket && isConnected) {
      socket.emit('new-message', data)
      console.log('🔌 Emitted new message:', data)
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinGroups,
        leaveGroups,
        emitNewMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
