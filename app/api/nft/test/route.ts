import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('wallet') || '0x8a8035F056af830B7205c58c1dC037f826fc2B92'
    const contractAddress = url.searchParams.get('contract') || '0xb5abff5c7f8cd72c302c4b70743c6069370a5952'

    console.log('🧪 Testing NFT verification:', { walletAddress, contractAddress })

    // Call our internal NFT verification API
    const verifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/nft/verify-ownership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        contractAddress
      })
    })

    const verifyData = await verifyResponse.json()

    return NextResponse.json({
      testParams: { walletAddress, contractAddress },
      verificationResult: verifyData,
      responseStatus: verifyResponse.status,
      responseOk: verifyResponse.ok,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in NFT test:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, contractAddress } = await request.json()

    console.log('🧪 Testing NFT verification with custom params:', { walletAddress, contractAddress })

    // Call our internal NFT verification API
    const verifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/nft/verify-ownership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        contractAddress
      })
    })

    const verifyData = await verifyResponse.json()

    return NextResponse.json({
      testParams: { walletAddress, contractAddress },
      verificationResult: verifyData,
      responseStatus: verifyResponse.status,
      responseOk: verifyResponse.ok,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in NFT test:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
