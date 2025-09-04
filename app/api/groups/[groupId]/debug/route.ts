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
    console.log('Debug - Session:', session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        _count: {
          select: { members: true }
        },
        members: {
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
        }
      }
    })

    console.log('Debug - Group found:', !!group)
    console.log('Debug - Group ID:', group?.id)
    console.log('Debug - Group creator:', group?.creatorId)
    console.log('Debug - Current user:', session.user.id)
    console.log('Debug - Is creator:', group?.creatorId === session.user.id)
    console.log('Debug - Members count:', group?._count.members)
    console.log('Debug - Members:', group?.members.map(m => m.userId))

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user has access to this group
    const isCreator = group.creatorId === session.user.id
    const isMember = group.members.some(member => member.userId === session.user.id)
    
    console.log('Debug - Is creator:', isCreator)
    console.log('Debug - Is member:', isMember)
    
    return NextResponse.json({
      debug: {
        groupId: params.groupId,
        userId: session.user.id,
        isCreator,
        isMember,
        memberCount: group._count.members,
        requiresApproval: group.requiresApproval
      },
      group: {
        id: group.id,
        name: group.name,
        profileImage: group.profileImage,
        contractAddress: group.contractAddress,
        requiresApproval: group.requiresApproval,
        memberCount: group._count.members,
        isCreator,
        members: group.members.map(member => ({
          id: member.user.id,
          name: member.user.name,
          twitterHandle: member.user.twitterHandle,
          profileImage: member.user.profileImage,
          joinedAt: member.joinedAt
        }))
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      error: 'Debug error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
