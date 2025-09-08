import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string, requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json() // 'approve' or 'reject'
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 })
    }

    // Check if user is the group creator
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      select: { creatorId: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group creators can manage join requests' }, { status: 403 })
    }

    // Get the join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: params.requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            twitterHandle: true
          }
        }
      }
    })

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    if (joinRequest.groupId !== params.groupId) {
      return NextResponse.json({ error: 'Join request does not belong to this group' }, { status: 400 })
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Join request has already been processed' }, { status: 400 })
    }

    if (action === 'approve') {
      // Use a transaction to approve the request and add the user to the group
      await prisma.$transaction(async (tx) => {
        // Update the join request status
        await tx.joinRequest.update({
          where: { id: params.requestId },
          data: { status: 'approved' }
        })

        // Add the user to the group
        await tx.groupMember.create({
          data: {
            userId: joinRequest.userId,
            groupId: params.groupId
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: `Approved ${joinRequest.user.name}'s request to join the group`
      })
    } else {
      // Reject the request
      await prisma.joinRequest.update({
        where: { id: params.requestId },
        data: { status: 'rejected' }
      })

      return NextResponse.json({
        success: true,
        message: `Rejected ${joinRequest.user.name}'s request to join the group`
      })
    }
  } catch (error) {
    console.error('Error processing join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
