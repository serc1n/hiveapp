import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bio } = await request.json()

    if (typeof bio !== 'string' || bio.length > 200) {
      return NextResponse.json({ error: 'Invalid bio' }, { status: 400 })
    }

    // Update user's bio
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { bio: bio.trim() || null }
    })

    return NextResponse.json({ 
      success: true, 
      bio: updatedUser.bio 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
