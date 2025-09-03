import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidEthereumAddress } from '@/lib/web3'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { walletAddress } = await request.json()

    if (!walletAddress || !isValidEthereumAddress(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    // Update user's wallet address
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress: walletAddress.toLowerCase() }
    })

    return NextResponse.json({ 
      success: true, 
      walletAddress: updatedUser.walletAddress 
    })
  } catch (error) {
    console.error('Error updating wallet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove user's wallet address
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing wallet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
