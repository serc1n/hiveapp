import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use deployment timestamp or build time as version
    const version = process.env.VERCEL_GIT_COMMIT_SHA || 
                   process.env.NEXT_BUILD_ID || 
                   Date.now().toString()
    
    return NextResponse.json({ 
      version,
      timestamp: new Date().toISOString(),
      buildTime: process.env.VERCEL_GIT_COMMIT_REF || 'main'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error getting version:', error)
    return NextResponse.json({ 
      version: Date.now().toString(),
      timestamp: new Date().toISOString(),
      error: 'Could not determine version'
    })
  }
}