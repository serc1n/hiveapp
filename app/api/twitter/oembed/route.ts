import { NextRequest, NextResponse } from 'next/server'

// Add CORS headers for public access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tweetUrl = searchParams.get('url')
    
    if (!tweetUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    console.log('🐦 Fetching Twitter data for:', tweetUrl)

    // First, fetch the oEmbed data
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&hide_media=false&hide_thread=false&omit_script=true&dnt=true`
    const oembedResponse = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'HiveApp/1.0 (https://hiveapp.vercel.app)',
        'Accept': 'application/json',
      },
    })

    if (!oembedResponse.ok) {
      console.error('❌ Twitter oEmbed API error:', oembedResponse.status, oembedResponse.statusText)
      throw new Error(`Twitter oEmbed API returned ${oembedResponse.status}`)
    }

    const oembedData = await oembedResponse.json()

    // Then, fetch the actual tweet page to get meta tags
    let enrichedData = { ...oembedData }
    
    try {
      const tweetPageResponse = await fetch(tweetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HiveApp/1.0; +https://hiveapp.vercel.app)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      if (tweetPageResponse.ok) {
        const htmlContent = await tweetPageResponse.text()
        
        // Extract meta tags for better data
        const metaTags = {
          title: extractMetaContent(htmlContent, 'twitter:title') || extractMetaContent(htmlContent, 'og:title'),
          description: extractMetaContent(htmlContent, 'twitter:description') || extractMetaContent(htmlContent, 'og:description'),
          image: extractMetaContent(htmlContent, 'twitter:image') || extractMetaContent(htmlContent, 'og:image'),
          card: extractMetaContent(htmlContent, 'twitter:card'),
          site: extractMetaContent(htmlContent, 'twitter:site'),
          creator: extractMetaContent(htmlContent, 'twitter:creator'),
          profileImage: extractMetaContent(htmlContent, 'twitter:image:src'),
        }

        // Extract username from creator (e.g., "@serc1n")
        const username = metaTags.creator || metaTags.site || ''
        
        // Extract display name from title (usually "Name (@username)")
        let displayName = oembedData.author_name || ''
        if (metaTags.title) {
          const titleMatch = metaTags.title.match(/^([^(]+)\s*\(@[^)]+\)/)
          if (titleMatch) {
            displayName = titleMatch[1].trim()
          }
        }

        // Enrich the oEmbed data with meta tag information
        enrichedData = {
          ...oembedData,
          meta_title: metaTags.title,
          meta_description: metaTags.description,
          meta_image: metaTags.image,
          twitter_card: metaTags.card,
          twitter_creator: username,
          twitter_display_name: displayName,
          twitter_profile_image: metaTags.profileImage,
        }

        console.log('✅ Enriched Twitter data:', {
          author_name: oembedData.author_name,
          display_name: displayName,
          username: username,
          card_type: metaTags.card,
          has_image: !!metaTags.image,
          html_length: oembedData.html?.length || 0
        })
      }
    } catch (enrichError) {
      console.warn('⚠️ Could not enrich Twitter data:', enrichError)
      // Continue with basic oEmbed data
    }

    return NextResponse.json(enrichedData, { headers: corsHeaders })
  } catch (error) {
    console.error('❌ Error fetching Twitter data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweet data' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Helper function to extract meta tag content
function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["'][^>]*>`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+name=["']${property}["'][^>]*>`, 'i'),
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}
