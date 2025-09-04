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

    const group = await prisma.group.findUnique({
      where: { id: params.groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: params.groupId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    // Check if group requires approval
    if (group.requiresApproval) {
      // Check if user already has a pending request
      const existingRequest = await prisma.joinRequest.findUnique({
        where: {
          userId_groupId: {
            userId: session.user.id,
            groupId: params.groupId
          }
        }
      })

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return NextResponse.json({ error: 'You already have a pending join request for this group' }, { status: 400 })
        } else if (existingRequest.status === 'rejected') {
          return NextResponse.json({ error: 'Your join request was rejected' }, { status: 403 })
        }
      }

      // Create join request instead of adding as member
      await prisma.joinRequest.create({
        data: {
          userId: session.user.id,
          groupId: params.groupId
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Join request submitted! The group owner will review your request.',
        requiresApproval: true 
      })
    }

    // Check if group is token-gated and verify NFT ownership
    if (group.contractAddress) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      
      if (!user?.walletAddress) {
        return NextResponse.json({ error: 'You must connect a wallet to join token-gated groups' }, { status: 403 })
      }
      
      // Check NFT ownership
      const { checkNFTOwnership } = await import('@/lib/web3')
      const hasAccess = await checkNFTOwnership(user.walletAddress, group.contractAddress)
      
      if (!hasAccess) {
        return NextResponse.json({ error: 'You do not own the required NFT to join this group' }, { status: 403 })
      }
    }

    // Add user to group (only if no approval required)
    await prisma.groupMember.create({
      data: {
        userId: session.user.id,
        groupId: params.groupId
      }
    })

    return NextResponse.json({ success: true, message: 'Successfully joined group' })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Don't allow creator to leave their own group
    if (group.creatorId === session.user.id) {
      return NextResponse.json({ error: 'Group creators cannot leave their own group' }, { status: 400 })
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

    return NextResponse.json({ success: true, message: 'Successfully left group' })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
