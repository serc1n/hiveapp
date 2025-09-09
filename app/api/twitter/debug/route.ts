import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tweetUrl = searchParams.get('url') || 'https://twitter.com/serc1n/status/1833215659050877115'
    
    console.log('🐦 DEBUG: Fetching Twitter data for:', tweetUrl)

    // First, fetch the oEmbed data
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&hide_media=false&hide_thread=false&omit_script=true&dnt=true`
    const oembedResponse = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'HiveApp/1.0 (https://hiveapp.vercel.app)',
        'Accept': 'application/json',
      },
    })

    if (!oembedResponse.ok) {
      throw new Error(`Twitter oEmbed API returned ${oembedResponse.status}`)
    }

    const oembedData = await oembedResponse.json()
    console.log('🐦 DEBUG: Raw oEmbed data:', JSON.stringify(oembedData, null, 2))

    // Then, fetch the actual tweet page
    const tweetPageResponse = await fetch(tweetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HiveApp/1.0; +https://hiveapp.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (tweetPageResponse.ok) {
      const htmlContent = await tweetPageResponse.text()
      
      // Extract meta tags
      const extractMetaContent = (html: string, property: string): string | null => {
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

      const metaTags = {
        title: extractMetaContent(htmlContent, 'twitter:title') || extractMetaContent(htmlContent, 'og:title'),
        description: extractMetaContent(htmlContent, 'twitter:description') || extractMetaContent(htmlContent, 'og:description'),
        image: extractMetaContent(htmlContent, 'twitter:image') || extractMetaContent(htmlContent, 'og:image'),
        card: extractMetaContent(htmlContent, 'twitter:card'),
        site: extractMetaContent(htmlContent, 'twitter:site'),
        creator: extractMetaContent(htmlContent, 'twitter:creator'),
        profileImage: extractMetaContent(htmlContent, 'twitter:image:src'),
      }

      console.log('🐦 DEBUG: Meta tags:', JSON.stringify(metaTags, null, 2))

      // Look for images in HTML
      const imgMatches = htmlContent.match(/<img[^>]+src="([^"]*)"[^>]*>/g) || []
      const images = imgMatches.map(match => {
        const srcMatch = match.match(/src="([^"]*)"/)
        return srcMatch ? srcMatch[1] : null
      }).filter(Boolean)

      console.log('🐦 DEBUG: Found images:', images)

      return NextResponse.json({
        tweetUrl,
        oembedData,
        metaTags,
        images,
        htmlLength: htmlContent.length,
        hasHtml: !!oembedData.html
      })
    }

    return NextResponse.json({
      tweetUrl,
      oembedData,
      error: 'Could not fetch tweet page'
    })

  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json(
      { error: 'Failed to debug tweet data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
