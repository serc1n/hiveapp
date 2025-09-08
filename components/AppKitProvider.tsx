'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet } from '@reown/appkit/networks'
import { ReactNode } from 'react'
import type { AppKitNetwork } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '2495cc0bb91d66458c515fdae1d3b3c5'

// 2. Set the networks with proper typing
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet]

// 3. Create a metadata object - optional
const metadata = {
  name: 'HiveApp',
  description: 'Token-gated group chat platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://hiveapp.vercel.app',
  icons: [
    typeof window !== 'undefined' ? `${window.location.origin}/hive.png` : 'https://hiveapp.vercel.app/hive.png'
  ]
}

// 4. Create Ethers adapter
const ethersAdapter = new EthersAdapter()

// 5. Create AppKit instance
createAppKit({
  adapters: [ethersAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: false, // Disable email connection
    socials: [], // Remove all social connections
    emailShowWallets: false, // Don't show wallets in email flow
  }
})

interface AppKitProviderProps {
  children: ReactNode
}

export function AppKitProvider({ children }: AppKitProviderProps) {
  return <>{children}</>
}
