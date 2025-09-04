import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)
    
    // Test groups table
    const groupCount = await prisma.group.count()
    console.log('Group count:', groupCount)
    
    // Test basic group fields
    const sampleGroup = await prisma.group.findFirst({
      select: {
        id: true,
        name: true,
        creatorId: true,
      }
    })
    console.log('Sample group:', sampleGroup)
    
    return NextResponse.json({ 
      success: true, 
      userCount, 
      groupCount, 
      sampleGroup,
      message: 'Database connection successful' 
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
