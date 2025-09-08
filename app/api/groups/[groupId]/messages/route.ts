import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    // Check if user has access to this group
    const isCreator = group.creatorId === session.user.id
    const isMember = group.members.length > 0
    
    // CRITICAL: Only creators and approved members can access messages
    if (!isCreator && !isMember) {
      return NextResponse.json({ error: 'You must be a member of this group to view messages' }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50') // Reduced default from 100 to 50
    const before = url.searchParams.get('before') // For pagination
    
    const whereClause: any = { groupId: params.groupId }
    if (before) {
      whereClause.createdAt = { lt: new Date(before) }
    }

    // Try to include reactions, but fallback gracefully if table doesn't exist
    let includeReactions = {}
    try {
      // Test if MessageReaction table exists by doing a simple query
      await prisma.messageReaction.findFirst({ take: 1 })
      includeReactions = {
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                twitterHandle: true
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('MessageReaction table not available yet, skipping reactions')
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            twitterHandle: true,
            profileImage: true
          }
        },
        ...includeReactions
      },
      orderBy: { createdAt: 'desc' }, // Changed to desc for better pagination
      take: Math.min(limit, 100) // Max 100 messages per request
    })
    
    // Reverse to get chronological order and process reactions
    const orderedMessages = messages.reverse().map(message => {
      // Safely process reactions (may not exist if table isn't created yet)
      let processedReactions: any[] = []
      
      if (message.reactions && Array.isArray(message.reactions)) {
        const groupedReactions = message.reactions.reduce((acc, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
              emoji: reaction.emoji,
              count: 0,
              users: [],
              userReacted: false
            }
          }
          
          acc[reaction.emoji].count++
          acc[reaction.emoji].users.push({
            id: reaction.user.id,
            name: reaction.user.name,
            twitterHandle: reaction.user.twitterHandle
          })
          
          if (reaction.userId === session.user.id) {
            acc[reaction.emoji].userReacted = true
          }
          
          return acc
        }, {} as Record<string, any>)
        
        processedReactions = Object.values(groupedReactions)
      }

      return {
        ...message,
        reactions: processedReactions
      }
    })

    return NextResponse.json({ messages: orderedMessages })
  } catch (error) {
    console.error('Error fetching messages:', error)
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

    const { content } = await request.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
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

    // Check if user has access to send messages
    const isCreator = group.creatorId === session.user.id
    const isMember = group.members.length > 0
    
    // CRITICAL: Only creators and approved members can send messages
    if (!isCreator && !isMember) {
      return NextResponse.json({ error: 'You must be a member of this group to send messages' }, { status: 403 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        groupId: params.groupId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            profileImage: true
          }
        }
      }
    })

    // Supabase Realtime will automatically broadcast this message to subscribers
    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
