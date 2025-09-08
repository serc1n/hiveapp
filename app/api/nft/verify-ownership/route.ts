import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, contractAddress } = await request.json()

    if (!walletAddress || !contractAddress) {
      return NextResponse.json({ error: 'Missing wallet address or contract address' }, { status: 400 })
    }

    // Use Alchemy API to check NFT ownership
    const alchemyApiKey = process.env.ALCHEMY_API_KEY
    if (!alchemyApiKey) {
      console.error('ALCHEMY_API_KEY not configured')
      return NextResponse.json({ error: 'NFT verification service not configured' }, { status: 500 })
    }

    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
    
    // Check if the wallet owns any NFTs from the contract
    const response = await fetch(alchemyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getNFTs',
        params: [
          walletAddress,
          {
            contractAddresses: [contractAddress],
            withMetadata: false,
          }
        ]
      })
    })

    const data = await response.json()

    if (data.error) {
      console.error('Alchemy API error:', data.error)
      return NextResponse.json({ error: 'Failed to verify NFT ownership' }, { status: 500 })
    }

    const ownedNFTs = data.result?.ownedNfts || []
    const ownsNFT = ownedNFTs.length > 0

    return NextResponse.json({ 
      ownsNFT,
      nftCount: ownedNFTs.length,
      contractAddress,
      walletAddress 
    })

  } catch (error) {
    console.error('Error verifying NFT ownership:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
