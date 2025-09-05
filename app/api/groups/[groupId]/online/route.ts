import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Simple in-memory store for online users (in production, use Redis)
const onlineUsers = new Map<string, Record<string, { userId: string, lastSeen: Date }>>()

// Clean up offline users (users who haven't been seen in 5 minutes)
const cleanupOfflineUsers = (groupId: string) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const groupKey = `group:${groupId}`
  
  if (onlineUsers.has(groupKey)) {
    const groupUsers = onlineUsers.get(groupKey)!
    for (const [userId, data] of Object.entries(groupUsers)) {
      if (data.lastSeen < fiveMinutesAgo) {
        delete groupUsers[userId]
      }
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clean up offline users
    cleanupOfflineUsers(params.groupId)
    
    const groupKey = `group:${params.groupId}`
    const groupUsers = onlineUsers.get(groupKey) || {}
    const onlineCount = Object.keys(groupUsers).length

    return NextResponse.json({ onlineCount })
  } catch (error) {
    console.error('Error getting online count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to the group
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isCreator = group.creatorId === session.user.id
    const isMember = group.members.length > 0
    
    if (!isCreator && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update user's online status
    const groupKey = `group:${params.groupId}`
    if (!onlineUsers.has(groupKey)) {
      onlineUsers.set(groupKey, {})
    }
    
    const groupUsers = onlineUsers.get(groupKey)!
    groupUsers[session.user.id] = {
      userId: session.user.id,
      lastSeen: new Date()
    }

    // Clean up offline users
    cleanupOfflineUsers(params.groupId)
    
    const onlineCount = Object.keys(groupUsers).length

    return NextResponse.json({ onlineCount })
  } catch (error) {
    console.error('Error updating online status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
