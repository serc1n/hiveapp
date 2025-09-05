import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveUploadedImage } from '@/lib/imageUpload'

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        _count: {
          select: { members: true }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                twitterHandle: true,
                profileImage: true
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user has access to this group
    const isCreator = group.creatorId === session.user.id
    const isMember = group.members.some(member => member.userId === session.user.id)
    
    if (!isCreator && !isMember) {
      // CRITICAL: Non-members can only see basic group info, not member details
      return NextResponse.json({
        group: {
          id: group.id,
          name: group.name,
          profileImage: group.profileImage,
          contractAddress: group.contractAddress,
          requiresApproval: group.requiresApproval,
          memberCount: group._count.members,
          isCreator: false,
          members: [], // Don't show member details to non-members
          requiresJoin: true
        }
      })
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        profileImage: group.profileImage,
        contractAddress: group.contractAddress,
        memberCount: group._count.members,
        isCreator: group.creatorId === session.user.id,
        creatorId: group.creatorId,
        members: group.members.map(member => ({
          id: member.user.id,
          name: member.user.name,
          twitterHandle: member.user.twitterHandle,
          profileImage: member.user.profileImage,
          joinedAt: member.joinedAt
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the group creator
    const group = await prisma.group.findUnique({
      where: { id: params.groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only group creators can update group settings' }, { status: 403 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const contractAddress = formData.get('contractAddress') as string
    const profileImage = formData.get('profileImage') as File | null

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Validate contract address if provided
    if (contractAddress && !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 })
    }

    // Handle image upload
    let imageUrl = group.profileImage
    if (profileImage) {
      try {
        imageUrl = await saveUploadedImage(profileImage, 'group')
      } catch (error) {
        console.error('Error uploading image:', error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
      }
    }

    // Update the group
    const updatedGroup = await prisma.group.update({
      where: { id: params.groupId },
      data: {
        name: name.trim(),
        profileImage: imageUrl,
        contractAddress: contractAddress?.trim() || null
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    return NextResponse.json({
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        profileImage: updatedGroup.profileImage,
        contractAddress: updatedGroup.contractAddress,
        memberCount: updatedGroup._count.members,
        isCreator: true
      }
    })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
