import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oembedUrl = searchParams.get('url')
    
    if (!oembedUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    console.log('🐦 Fetching Twitter oEmbed data for:', oembedUrl)

    // Fetch from Twitter's oEmbed API
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'HiveApp/1.0 (https://hiveapp.vercel.app)',
      },
    })

    if (!response.ok) {
      console.error('❌ Twitter oEmbed API error:', response.status, response.statusText)
      throw new Error(`Twitter oEmbed API returned ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Twitter oEmbed data received:', {
      author_name: data.author_name,
      author_url: data.author_url,
      html_length: data.html?.length || 0
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error fetching Twitter oEmbed data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweet data' },
      { status: 500 }
    )
  }
}
