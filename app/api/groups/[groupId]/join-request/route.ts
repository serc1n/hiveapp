import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Create join request
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        members: {
          where: { userId: session.user.id }
        },
        joinRequests: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member
    if (group.members.length > 0 || group.creatorId === session.user.id) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 })
    }

    // Check if user already has a pending request
    if (group.joinRequests.length > 0) {
      const existingRequest = group.joinRequests[0]
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'You already have a pending request for this group' }, { status: 400 })
      }
    }

    // If group doesn't require approval, join directly
    if (!group.requiresApproval) {
      await prisma.groupMember.create({
        data: {
          userId: session.user.id,
          groupId: params.groupId
        }
      })
      return NextResponse.json({ success: true, joined: true })
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId: session.user.id,
        groupId: params.groupId
      }
    })

    return NextResponse.json({ success: true, joinRequest })
  } catch (error) {
    console.error('Error creating join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get join request status
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: params.groupId
        }
      }
    })

    return NextResponse.json({ joinRequest })
  } catch (error) {
    console.error('Error fetching join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Cancel join request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.joinRequest.delete({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: params.groupId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
