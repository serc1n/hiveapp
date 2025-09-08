import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, allow any logged-in user to create the table
    // In production, you might want to restrict this to admins only
    
    try {
      // Try to create the table using raw SQL
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "message_reactions" (
          "id" TEXT NOT NULL,
          "emoji" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "messageId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
        );
      `
      
      // Create unique index
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "message_reactions_userId_messageId_emoji_key" 
        ON "message_reactions"("userId", "messageId", "emoji");
      `
      
      // Add foreign key constraints
      await prisma.$executeRaw`
        ALTER TABLE "message_reactions" 
        ADD CONSTRAINT IF NOT EXISTS "message_reactions_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `
      
      await prisma.$executeRaw`
        ALTER TABLE "message_reactions" 
        ADD CONSTRAINT IF NOT EXISTS "message_reactions_messageId_fkey" 
        FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `

      return NextResponse.json({ 
        success: true, 
        message: 'MessageReaction table created successfully' 
      })
    } catch (sqlError) {
      console.error('Error creating table:', sqlError)
      return NextResponse.json({ 
        error: 'Failed to create table', 
        details: sqlError instanceof Error ? sqlError.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in create-reactions-table:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
