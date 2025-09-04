import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotificationToGroupMembers } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcements = await prisma.announcement.findMany({
      where: { groupId: params.groupId },
      include: {
        user: {
          select: {
            name: true,
            twitterHandle: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Error fetching announcements:', error)
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

    const { messageId } = await request.json()

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // Get the message and verify it exists in this group
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        group: true,
        user: {
          select: {
            name: true,
            twitterHandle: true
          }
        }
      }
    })

    if (!message || message.groupId !== params.groupId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user is the group creator (only creators can make announcements)
    const group = await prisma.group.findUnique({
      where: { id: params.groupId }
    })

    if (!group || group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group creators can make announcements' }, { status: 403 })
    }

    // Check if announcement already exists for this message
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { messageId }
    })

    if (existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement already exists for this message' }, { status: 400 })
    }

    // Create the announcement
    const announcement = await prisma.announcement.create({
      data: {
        messageId,
        content: message.content,
        userId: message.userId,
        groupId: params.groupId
      },
      include: {
        user: {
          select: {
            name: true,
            twitterHandle: true,
            profileImage: true
          }
        }
      }
    })

    // Send notifications to group members
    try {
      await sendNotificationToGroupMembers(
        params.groupId,
        `🐝 New HiveApp Announcement`,
        `New announcement in ${group.name}: ${message.content.slice(0, 100) + (message.content.length > 100 ? '...' : '')}`,
        session.user.id // Exclude the creator from notifications
      )
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the announcement creation if notifications fail
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
