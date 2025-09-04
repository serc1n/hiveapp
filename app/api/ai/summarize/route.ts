import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const TIME_PERIOD_HOURS = {
  '1h': 1,
  '8h': 8,
  '12h': 12,
  '24h': 24,
  '3d': 72,
  '7d': 168,
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId, timePeriod } = await request.json()

    if (!groupId || !timePeriod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const hours = TIME_PERIOD_HOURS[timePeriod as keyof typeof TIME_PERIOD_HOURS]
    if (!hours) {
      return NextResponse.json({ error: 'Invalid time period' }, { status: 400 })
    }

    // Check if user has access to this group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const isCreator = group.creatorId === session.user.id
    const isMember = group.members.length > 0

    if (!isCreator && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages from the specified time period
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    const messages = await prisma.message.findMany({
      where: {
        groupId,
        createdAt: {
          gte: timeThreshold
        }
      },
      include: {
        user: {
          select: {
            name: true,
            twitterHandle: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (messages.length === 0) {
      return NextResponse.json({
        summary: `No messages found in the last ${timePeriod === '3d' ? '3 days' : timePeriod === '7d' ? '7 days' : timePeriod.replace('h', ' hours')}.`
      })
    }

    // Format messages for AI processing
    const formattedMessages = messages.map(msg => 
      `${msg.user.name} (@${msg.user.twitterHandle}): ${msg.content}`
    ).join('\n')

    // Generate AI summary using OpenAI (you'll need to add OpenAI API key)
    const summary = await generateAISummary(formattedMessages, timePeriod, group.name)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating AI summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateAISummary(messages: string, timePeriod: string, groupName: string): Promise<string> {
  const messageCount = messages.split('\n').length
  const timeLabel = timePeriod === '3d' ? '3 days' : timePeriod === '7d' ? '7 days' : timePeriod.replace('h', ' hours')
  
  // If no OpenAI API key, return basic summary
  if (!process.env.OPENAI_API_KEY) {
    const lines = messages.split('\n')
    const uniqueUsers = new Set(lines.map(line => line.split(':')[0]))
    
    return `📊 Key Statistics
• ${messageCount} messages exchanged
• ${uniqueUsers.size} active participants
• Group: ${groupName}

💬 Recent Messages
${lines.slice(-3).map(line => `• ${line}`).join('\n')}

⚡ Activity Level
${messageCount > 50 ? 'Very Active' : messageCount > 20 ? 'Active' : messageCount > 5 ? 'Moderate' : 'Light'} - Based on message count over ${timeLabel}

Add OPENAI_API_KEY to environment variables for full AI-powered analysis.`
  }

  try {
    const { OpenAI } = require('openai')
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `Analyze and summarize the following group chat messages from "${groupName}" over the last ${timeLabel}.

Provide a clean, well-structured summary without markdown formatting. Use this exact format:

📊 Key Statistics
• ${messageCount} messages exchanged
• [Number] active participants
• Activity period: ${timeLabel}

🎯 Main Topics Discussed
• [List the 2-3 main conversation topics]

💡 Important Highlights  
• [Key decisions, announcements, or notable moments]

👥 Most Active Participants
• [Who contributed most to the conversation]

📈 Overall Sentiment
[Describe the general mood and tone]

⚡ Activity Level
[Rate as Very Active/Active/Moderate/Light with brief explanation]

Messages to analyze:
${messages}

Keep responses concise but informative. Use bullet points with • symbol. No markdown headers or ** formatting.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Best price/performance ratio
      messages: [
        {
          role: 'system',
          content: 'You are an expert community manager and data analyst. Provide clean, well-structured summaries without markdown formatting. Use emojis for section headers and bullet points for lists. Be concise and insightful.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3, // Lower temperature for more consistent, factual summaries
    })

    const aiSummary = response.choices[0]?.message?.content || 'Unable to generate summary'
    
    // Add footer with AI model info
    return `${aiSummary}

✨ AI Summary powered by GPT-4o-mini • ${messageCount} messages analyzed`

  } catch (error) {
    console.error('OpenAI API error:', error)
    
    // Fallback to basic summary if OpenAI fails
    const lines = messages.split('\n')
    const uniqueUsers = new Set(lines.map(line => line.split(':')[0]))
    
    return `📊 Key Statistics
• ${messageCount} messages exchanged  
• ${uniqueUsers.size} active participants
• Group: ${groupName}

💬 Recent Messages
${lines.slice(-5).map(line => `• ${line}`).join('\n')}

⚡ Activity Level
${messageCount > 50 ? 'Very Active' : messageCount > 20 ? 'Active' : messageCount > 5 ? 'Moderate' : 'Light'} - Based on message count over ${timeLabel}

⚠️ AI analysis temporarily unavailable. Showing basic summary.`
  }
}

