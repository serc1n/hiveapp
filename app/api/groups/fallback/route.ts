import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simplified query without new fields
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const groupsWithCreatorFlag = groups.map(group => ({
      id: group.id,
      name: group.name,
      profileImage: group.profileImage,
      contractAddress: group.contractAddress,
      memberCount: group._count.members,
      isCreator: group.creatorId === session.user.id,
      hasAccess: true,
      lastMessage: null, // Simplified
      updatedAt: group.updatedAt
    }))

    return NextResponse.json({ groups: groupsWithCreatorFlag })
  } catch (error) {
    console.error('Fallback API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
