import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { savePushSubscription } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await request.json()

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    await savePushSubscription(session.user.id, subscription)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
    }

    // Remove subscription from database
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: endpoint
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
