import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Get pending join requests and members (for group admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is the group creator
    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group owners can access admin panel' }, { status: 403 })
    }

    // Get pending join requests
    const joinRequests = await prisma.joinRequest.findMany({
      where: {
        groupId: params.groupId,
        status: 'pending'
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
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get current members
    const members = await prisma.groupMember.findMany({
      where: { groupId: params.groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            profileImage: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    })

    return NextResponse.json({ joinRequests, members })
  } catch (error) {
    console.error('Error fetching admin data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Approve or reject join request
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, userId } = await request.json()

    if (!['approve', 'reject'].includes(action) || !userId) {
      return NextResponse.json({ error: 'Invalid action or userId' }, { status: 400 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is the group creator
    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group owners can manage join requests' }, { status: 403 })
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: params.groupId
        }
      }
    })

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Add user as member
      await prisma.groupMember.create({
        data: {
          userId,
          groupId: params.groupId
        }
      })

      // Update join request status
      await prisma.joinRequest.update({
        where: { id: joinRequest.id },
        data: { status: 'approved' }
      })
    } else {
      // Update join request status to rejected
      await prisma.joinRequest.update({
        where: { id: joinRequest.id },
        data: { status: 'rejected' }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error managing join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Remove member from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is the group creator
    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group owners can remove members' }, { status: 403 })
    }

    // Don't allow removing the creator
    if (userId === group.creatorId) {
      return NextResponse.json({ error: 'Cannot remove group creator' }, { status: 400 })
    }

    // Remove member
    await prisma.groupMember.deleteMany({
      where: {
        userId,
        groupId: params.groupId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
