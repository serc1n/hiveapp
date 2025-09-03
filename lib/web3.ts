import { ethers } from 'ethers'

// ERC-721 ABI for checking NFT ownership
const ERC721_ABI = [
  'function balanceOf(address owner) external view returns (uint256 balance)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)',
]

export async function checkNFTOwnership(walletAddress: string, contractAddress: string): Promise<boolean> {
  try {
    // Use a public RPC provider (you might want to use your own RPC endpoint)
    const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com')
    
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider)
    
    const balance = await contract.balanceOf(walletAddress)
    
    return balance > 0
  } catch (error) {
    console.error('Error checking NFT ownership:', error)
    return false
  }
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
