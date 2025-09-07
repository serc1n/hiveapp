import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the group creator
    const group = await prisma.group.findUnique({
      where: { id: params.groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group creators can remove members' }, { status: 403 })
    }

    // Don't allow creator to remove themselves
    if (params.memberId === session.user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself as creator' }, { status: 400 })
    }

    // Remove the member
    await prisma.groupMember.deleteMany({
      where: {
        userId: params.memberId,
        groupId: params.groupId
      }
    })

    return NextResponse.json({ success: true, message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
