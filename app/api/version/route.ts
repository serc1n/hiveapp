import { NextResponse } from 'next/server'

// Version information - increment this when you want to force an update
const APP_VERSION = '1.0.0'
const BUILD_TIMESTAMP = Date.now()

export async function GET() {
  return NextResponse.json({
    version: APP_VERSION,
    buildTimestamp: BUILD_TIMESTAMP,
    updateAvailable: false, // This will be determined by the client
  })
}
