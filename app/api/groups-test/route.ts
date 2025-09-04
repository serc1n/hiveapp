import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('=== GROUPS TEST START ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session user ID:', session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Checking user exists...')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    console.log('User found:', !!user)

    if (!user) {
      console.log('User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Fetching groups...')
    // Test the exact same query as the main API
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
    
    console.log('Groups found:', groups.length)
    console.log('Groups:', groups.map(g => ({ id: g.id, name: g.name })))

    const result = groups.map(group => ({
      id: group.id,
      name: group.name,
      profileImage: group.profileImage,
      contractAddress: group.contractAddress,
      memberCount: group._count.members,
      isCreator: group.creatorId === session.user.id,
      hasAccess: true,
      updatedAt: group.updatedAt
    }))

    console.log('=== GROUPS TEST SUCCESS ===')
    return NextResponse.json({ 
      success: true,
      groups: result,
      debug: {
        userId: session.user.id,
        groupCount: groups.length
      }
    })
  } catch (error) {
    console.error('=== GROUPS TEST ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error),
      type: typeof error,
      name: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 })
  }
}
