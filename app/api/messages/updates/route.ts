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

    const { searchParams } = new URL(request.url)
    const lastCheck = searchParams.get('lastCheck')
    const lastCheckTime = lastCheck ? new Date(parseInt(lastCheck)) : new Date(Date.now() - 60000) // Default 1 minute ago

    // Get user's groups with new messages since lastCheck
    const groupsWithNewMessages = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        },
        messages: {
          some: {
            createdAt: {
              gt: lastCheckTime
            },
            // Don't count user's own messages as "new"
            userId: {
              not: session.user.id
            }
          }
        }
      },
      include: {
        messages: {
          where: {
            createdAt: {
              gt: lastCheckTime
            },
            userId: {
              not: session.user.id
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                createdAt: {
                  gt: lastCheckTime
                },
                userId: {
                  not: session.user.id
                }
              }
            }
          }
        }
      }
    })

    // Format the response with new message info
    const updates = groupsWithNewMessages.map(group => ({
      groupId: group.id,
      groupName: group.name,
      newMessageCount: group._count.messages,
      lastMessage: group.messages[0] ? {
        id: group.messages[0].id,
        content: group.messages[0].content,
        createdAt: group.messages[0].createdAt,
        user: group.messages[0].user
      } : null
    }))

    return NextResponse.json({
      hasUpdates: updates.length > 0,
      updates,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error checking for message updates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
