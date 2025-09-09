import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if User table exists and get schema info
    const userCount = await prisma.user.count()
    console.log('👥 User count:', userCount)
    
    // Get a sample user (without sensitive data)
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        twitterId: true,
        twitterHandle: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // Check if MessageReaction table exists
    let reactionCount = 0
    try {
      reactionCount = await prisma.messageReaction.count()
      console.log('💬 Message reactions count:', reactionCount)
    } catch (error) {
      console.log('⚠️ MessageReaction table issue:', error)
    }
    
    // Get database info
    const result = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `
    
    return NextResponse.json({
      status: 'success',
      database: {
        connected: true,
        userCount,
        reactionCount,
        sampleUser,
        tables: result
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Database error:', error)
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown',
        code: (error as any)?.code || 'UNKNOWN'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
