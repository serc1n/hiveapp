import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    "name": "HiveApp - Token Gated Chat",
    "short_name": "HiveApp",
    "description": "Modern token-gated chat application with Twitter authentication",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#000000",
    "theme_color": "#000000",
    "orientation": "portrait-primary",
    "icons": [
      {
        "src": "/hive.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/hive.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      }
    ],
    "categories": ["social", "communication"],
    "lang": "en",
    "dir": "ltr"
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
