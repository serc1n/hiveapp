import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Starting groups fetch...')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching user...')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    console.log('User found:', !!user)

    if (!user) {
      console.log('User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Fetching groups...')
    // Very basic query first
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
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Groups found:', groups.length)

    const result = groups.map(group => ({
      id: group.id,
      name: group.name,
      profileImage: group.profileImage,
      contractAddress: group.contractAddress,
      memberCount: group._count.members,
      isCreator: group.creatorId === session.user.id,
      hasAccess: true,
      lastMessage: null,
      updatedAt: group.updatedAt
    }))

    console.log('Returning result...')
    return NextResponse.json({ groups: result })
  } catch (error) {
    console.error('Clean API error:', error)
    console.error('Error type:', typeof error)
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      type: typeof error,
      name: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 })
  }
}
