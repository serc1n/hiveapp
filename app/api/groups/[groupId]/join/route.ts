import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  let session: any = null
  try {
    console.log('🔍 Getting session for join request...')
    session = await getServerSession(authOptions)
    console.log('🔍 Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userName: session?.user?.name
    })
    
    if (!session?.user?.id) {
      console.log('❌ No valid session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ Valid session found for user:', session.user.id)

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        members: {
          where: { userId: session.user.id }
        },
        joinRequests: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check NFT ownership for token-gated groups
    if (group.contractAddress) {
      // Get user's wallet address
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { walletAddress: true }
      })

      if (!user?.walletAddress) {
        return NextResponse.json({ 
          error: 'Wallet connection required',
          message: 'You need to connect your wallet to join this token-gated group'
        }, { status: 400 })
      }

      // Verify NFT ownership
      try {
        const verifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/nft/verify-ownership`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: user.walletAddress,
            contractAddress: group.contractAddress
          })
        })

        const verifyData = await verifyResponse.json()

        if (!verifyResponse.ok || !verifyData.ownsNFT) {
          return NextResponse.json({ 
            error: 'NFT ownership required',
            message: `You need to own an NFT from collection ${group.contractAddress} to join this group`
          }, { status: 403 })
        }

        console.log(`✅ NFT ownership verified for user ${session.user.id} in contract ${group.contractAddress}`)
      } catch (error) {
        console.error('Error verifying NFT ownership:', error)
        return NextResponse.json({ 
          error: 'NFT verification failed',
          message: 'Unable to verify NFT ownership at this time. Please try again later.'
        }, { status: 500 })
      }
    }

    // Check if user is already a member
    if (group.members.length > 0) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    // Check if user already has a pending join request
    if (group.joinRequests.length > 0) {
      const existingRequest = group.joinRequests[0]
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Join request already pending approval' }, { status: 400 })
      }
      if (existingRequest.status === 'rejected') {
        return NextResponse.json({ error: 'Your join request was rejected' }, { status: 403 })
      }
    }

    // Check if group requires approval
    if (group.requiresApproval) {
      console.log('Creating join request for approval-required group:', {
        userId: session.user.id,
        groupId: params.groupId,
        status: 'pending'
      })
      
      // Create a join request instead of directly adding to group
      await prisma.joinRequest.create({
        data: {
          userId: session.user.id,
          groupId: params.groupId,
          status: 'pending'
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Join request sent! Waiting for approval from group creator.',
        requiresApproval: true 
      })
    } else {
      console.log('Creating direct group membership:', {
        userId: session.user.id,
        groupId: params.groupId
      })
      
      // Direct join for groups that don't require approval
      await prisma.groupMember.create({
        data: {
          userId: session.user.id,
          groupId: params.groupId
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully joined the group',
        requiresApproval: false 
      })
    }
  } catch (error) {
    console.error('❌ CRITICAL ERROR in join group API:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      groupId: params.groupId,
      userId: session?.user?.id,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorCode: (error as any)?.code,
      errorMeta: (error as any)?.meta
    })
    
    // More specific error handling for Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        console.error('❌ Unique constraint violation - user might already be a member')
        return NextResponse.json({ 
          error: 'You are already a member of this group or have a pending request',
          details: 'Duplicate membership attempt'
        }, { status: 400 })
      }
      
      if (error.message.includes('Foreign key constraint')) {
        console.error('❌ Foreign key constraint violation')
        return NextResponse.json({ 
          error: 'Invalid group or user reference',
          details: 'Database constraint violation'
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}