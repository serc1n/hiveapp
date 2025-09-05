import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get only groups where user is NOT a member and NOT the creator
    const groups = await prisma.group.findMany({
      where: {
        AND: [
          { creatorId: { not: session.user.id } }, // Not the creator
          {
            NOT: {
              members: {
                some: {
                  userId: session.user.id
                }
              }
            }
          } // Not a member
        ]
      },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const groupsWithMembershipStatus = groups.map(group => ({
      id: group.id,
      name: group.name,
      profileImage: group.profileImage,
      contractAddress: group.contractAddress,
      memberCount: group._count.members,
      isCreator: false, // User is never creator in explore
      isMember: false,  // User is never member in explore
      hasAccess: false, // User needs to join to get access
      lastMessage: null, // No message preview for groups user isn't in
      updatedAt: group.updatedAt
    }))

    return NextResponse.json({ groups: groupsWithMembershipStatus })
  } catch (error) {
    console.error('Error fetching groups for browse:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
