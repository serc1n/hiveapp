import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkNFTOwnership } from '@/lib/web3'
import { saveUploadedImage } from '@/lib/imageUpload'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only get groups where user is a member or creator
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
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                twitterHandle: true
              }
            }
          }
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
      hasAccess: true, // User is already a member
      lastMessage: group.messages.length > 0 ? {
        content: group.messages[0].content,
        createdAt: group.messages[0].createdAt,
        user: group.messages[0].user
      } : null,
      updatedAt: group.updatedAt
    }))

    return NextResponse.json({ groups: groupsWithCreatorFlag })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const contractAddress = formData.get('contractAddress') as string
    const requiresApproval = formData.get('requiresApproval') === 'true'
    const profileImage = formData.get('profileImage') as File | null

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Validate contract address if provided
    if (contractAddress && !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 })
    }

    // Handle image upload
    let imageUrl = null
    if (profileImage) {
      try {
        imageUrl = await saveUploadedImage(profileImage, 'group')
      } catch (error) {
        console.error('Error uploading image:', error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
      }
    }

    // Create the group
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        profileImage: imageUrl,
        contractAddress: contractAddress?.trim() || null,
        requiresApproval,
        creatorId: session.user.id
      }
    })

    // Add creator as a member
    await prisma.groupMember.create({
      data: {
        userId: session.user.id,
        groupId: group.id
      }
    })

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}