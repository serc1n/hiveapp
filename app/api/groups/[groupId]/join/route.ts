import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  let session: any = null
  try {
    session = await getServerSession(authOptions)
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
    if (group.members.length > 0) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    // Check if user already has a pending join request
    if (group.joinRequests.length > 0) {
      const existingRequest = group.joinRequests[0]
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Join request already pending approval' }, { status: 400 })
      }
      if (existingRequest.status === 'rejected') {
        return NextResponse.json({ error: 'Your join request was rejected' }, { status: 403 })
      }
    }

    // Check if group requires approval
    if (group.requiresApproval) {
      console.log('Creating join request for approval-required group:', {
        userId: session.user.id,
        groupId: params.groupId,
        status: 'pending'
      })
      
      // Create a join request instead of directly adding to group
      await prisma.joinRequest.create({
        data: {
          userId: session.user.id,
          groupId: params.groupId,
          status: 'pending'
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Join request sent! Waiting for approval from group creator.',
        requiresApproval: true 
      })
    } else {
      console.log('Creating direct group membership:', {
        userId: session.user.id,
        groupId: params.groupId
      })
      
      // Direct join for groups that don't require approval
      await prisma.groupMember.create({
        data: {
          userId: session.user.id,
          groupId: params.groupId
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully joined the group',
        requiresApproval: false 
      })
    }
  } catch (error) {
    console.error('Error joining group:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      groupId: params.groupId,
      userId: session?.user?.id
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}