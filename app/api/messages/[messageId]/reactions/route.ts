import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emoji } = await request.json()
    
    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 })
    }

    // Validate emoji is a single character or valid emoji
    if (emoji.length > 4) { // Allow for complex emojis
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
    }

    // Check if MessageReaction table exists, if not return error with instructions
    try {
      await prisma.messageReaction.findFirst({ take: 1 })
    } catch (tableError) {
      console.error('MessageReaction table does not exist:', tableError)
      return NextResponse.json({ 
        error: 'Reactions feature not available yet. Database table needs to be created.',
        details: 'MessageReaction table missing'
      }, { status: 503 })
    }

    // Check if message exists and user has access to it
    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
      include: {
        group: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user is a member of the group
    if (message.group.members.length === 0) {
      return NextResponse.json({ error: 'Not authorized to react to this message' }, { status: 403 })
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        userId_messageId_emoji: {
          userId: session.user.id,
          messageId: params.messageId,
          emoji: emoji
        }
      }
    })

    if (existingReaction) {
      // Remove existing reaction (toggle off)
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      })

      return NextResponse.json({ 
        success: true, 
        action: 'removed',
        message: 'Reaction removed' 
      })
    } else {
      // Add new reaction
      await prisma.messageReaction.create({
        data: {
          emoji: emoji,
          userId: session.user.id,
          messageId: params.messageId
        }
      })

      return NextResponse.json({ 
        success: true, 
        action: 'added',
        message: 'Reaction added' 
      })
    }
  } catch (error) {
    console.error('Error handling message reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all reactions for this message
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: params.messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            twitterHandle: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
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

    return NextResponse.json({ 
      reactions: Object.values(groupedReactions)
    })
  } catch (error) {
    console.error('Error fetching message reactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
