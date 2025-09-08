'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet } from '@reown/appkit/networks'
import { ReactNode } from 'react'
import type { AppKitNetwork } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '198428b2135fe152f2d234d15c7d2f77'

// 2. Set the networks with proper typing
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet]

// 3. Create a metadata object - optional
const metadata = {
  name: 'HiveApp',
  description: 'Token-gated group chat platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://hiveapp.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
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
  }
})

interface AppKitProviderProps {
  children: ReactNode
}

export function AppKitProvider({ children }: AppKitProviderProps) {
  return <>{children}</>
}
