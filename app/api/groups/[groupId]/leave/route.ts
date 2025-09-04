import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if group exists
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

    // Check if user is the creator (creators cannot leave their own groups)
    if (group.creatorId === session.user.id) {
      return NextResponse.json({ 
        error: 'Group creators cannot leave their own groups. You can delete the group instead.' 
      }, { status: 400 })
    }

    // Check if user is a member
    if (group.members.length === 0) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 400 })
    }

    // Remove user from group
    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: params.groupId
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully left the group' 
    })

  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
