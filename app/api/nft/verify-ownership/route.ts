import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, contractAddress } = await request.json()

    console.log('🔍 NFT Verification Request:', {
      walletAddress,
      contractAddress,
      timestamp: new Date().toISOString()
    })

    if (!walletAddress || !contractAddress) {
      console.error('❌ Missing required parameters:', { walletAddress, contractAddress })
      return NextResponse.json({ error: 'Missing wallet address or contract address' }, { status: 400 })
    }

    // Use Alchemy API to check NFT ownership
    const alchemyApiKey = process.env.ALCHEMY_API_KEY
    if (!alchemyApiKey) {
      console.error('❌ ALCHEMY_API_KEY not configured')
      return NextResponse.json({ error: 'NFT verification service not configured' }, { status: 500 })
    }

    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
    
    console.log('📡 Making Alchemy API call:', {
      url: alchemyUrl.replace(alchemyApiKey, 'HIDDEN'),
      walletAddress,
      contractAddress
    })
    
    // Check if the wallet owns any NFTs from the contract using Alchemy's REST API
    const nftApiUrl = `${alchemyUrl}/getNFTs?owner=${walletAddress}&contractAddresses[]=${contractAddress}&withMetadata=false`
    
    console.log('📡 Making Alchemy REST API call:', {
      url: nftApiUrl.replace(alchemyApiKey, 'HIDDEN'),
      method: 'GET'
    })
    
    const response = await fetch(nftApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    const data = await response.json()
    
    console.log('📊 Alchemy API response:', {
      hasError: !!data.error,
      error: data.error,
      ownedNftsCount: data.ownedNfts?.length || 0,
      firstFewNfts: data.ownedNfts?.slice(0, 3) || [],
      totalCount: data.totalCount || 0,
      rawResponse: data
    })

    if (data.error) {
      console.error('❌ Alchemy API error:', data.error)
      return NextResponse.json({ 
        error: 'Failed to verify NFT ownership',
        details: data.error 
      }, { status: 500 })
    }

    const ownedNFTs = data.ownedNfts || []
    const ownsNFT = ownedNFTs.length > 0

    console.log('✅ NFT Verification Result:', {
      ownsNFT,
      nftCount: ownedNFTs.length,
      contractAddress,
      walletAddress
    })

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
