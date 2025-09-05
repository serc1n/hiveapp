import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new ServerIO(res.socket.server)
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      // Join user to their groups
      socket.on('join-groups', (groupIds: string[]) => {
        groupIds.forEach(groupId => {
          socket.join(`group:${groupId}`)
        })
        console.log(`User ${socket.id} joined groups:`, groupIds)
      })

      // Leave groups
      socket.on('leave-groups', (groupIds: string[]) => {
        groupIds.forEach(groupId => {
          socket.leave(`group:${groupId}`)
        })
      })

      // Handle new message broadcast
      socket.on('new-message', (data) => {
        // Broadcast to all users in the group except sender
        socket.to(`group:${data.groupId}`).emit('message-received', data)
      })

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
      })
    })
  }
  res.end()
}

export default SocketHandler
