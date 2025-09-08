'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, Wallet, CheckCircle, AlertCircle } from 'lucide-react'
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react'

interface WalletConnectionProps {
  onClose: () => void
}

export function WalletConnection({ onClose }: WalletConnectionProps) {
  const { data: session, update } = useSession()
  const [address, setAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const { open } = useAppKit()
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()

  // Sync AppKit state with local state and auto-save wallet
  useEffect(() => {
    if (appKitConnected && appKitAddress) {
      setAddress(appKitAddress)
      setIsConnected(true)
      
      // Automatically save the wallet address
      const autoSaveWallet = async () => {
        if (session?.user?.id && appKitAddress !== session?.user?.walletAddress) {
          try {
            const response = await fetch('/api/user/wallet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ walletAddress: appKitAddress }),
            })

            if (response.ok) {
              await update() // Refresh session
              // Don't auto-close, let user close manually with X button
            }
          } catch (error) {
            console.error('Error auto-saving wallet:', error)
          }
        }
      }
      
      autoSaveWallet()
    } else {
      if (!address) { // Only clear if we don't have a manual address
        setIsConnected(false)
      }
    }
  }, [appKitConnected, appKitAddress, address, session?.user?.id, session?.user?.walletAddress, update, onClose])

  const handleSaveWallet = async () => {
    if (!address || !session?.user?.id) return

    setIsUpdating(true)
    try {
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      })

      if (response.ok) {
        await update() // Refresh session
        setUpdateStatus('success')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setUpdateStatus('error')
      }
    } catch (error) {
      console.error('Error updating wallet:', error)
      setUpdateStatus('error')
    } finally {
      setIsUpdating(false)
    }
  }

  const connectMetaMask = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          
          // Auto-save MetaMask wallet
          if (session?.user?.id && accounts[0] !== session?.user?.walletAddress) {
            try {
              const response = await fetch('/api/user/wallet', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress: accounts[0] }),
              })

              if (response.ok) {
                await update()
                // Don't auto-close, let user close manually
              }
            } catch (error) {
              console.error('Error auto-saving MetaMask wallet:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error connecting MetaMask:', error)
        alert('❌ Failed to connect MetaMask. Please try again.')
      }
    } else {
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // On mobile, use proper deep linking for MetaMask
        const currentUrl = window.location.href
        const metamaskDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
        
        const userChoice = confirm(
          '🦊 Connect MetaMask Wallet\n\n' +
          'This will open MetaMask app to connect your wallet securely.\n\n' +
          'Make sure you have MetaMask app installed on your device.'
        )
        
        if (userChoice) {
          // Use the correct deep link format for MetaMask mobile
          window.open(metamaskDeepLink, '_self')
        }
      } else {
        alert('Please install MetaMask browser extension from metamask.io')
      }
    }
  }

  const connectWalletConnect = async () => {
    try {
      // Close this modal first
      onClose()
      // Then open AppKit modal
      await open()
    } catch (error) {
      console.error('Error opening WalletConnect modal:', error)
      alert('❌ Failed to open wallet connection modal. Please try again.')
    }
  }

  // Auto-open WalletConnect modal when component mounts (for Manage Wallet button)
  useEffect(() => {
    const autoOpenWalletConnect = async () => {
      // Small delay to ensure modal is rendered
      setTimeout(async () => {
        try {
          onClose()
          await open()
        } catch (error) {
          console.error('Error auto-opening WalletConnect:', error)
        }
      }, 100)
    }

    // Auto-open WalletConnect for wallet management
    autoOpenWalletConnect()
  }, [])

  const connectCoinbaseWallet = async () => {
    try {
      // Check for Coinbase Wallet
      if (typeof window !== 'undefined' && window.ethereum && (window.ethereum as any).isCoinbaseWallet) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          
          // Auto-save Coinbase wallet
          if (session?.user?.id && accounts[0] !== session?.user?.walletAddress) {
            try {
              const response = await fetch('/api/user/wallet', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress: accounts[0] }),
              })

              if (response.ok) {
                await update()
                // Don't auto-close, let user close manually
              }
            } catch (error) {
              console.error('Error auto-saving Coinbase wallet:', error)
            }
          }
        }
      } else {
        // Redirect to Coinbase Wallet
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        
        if (isMobile) {
          const coinbaseDeepLink = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`
          window.open(coinbaseDeepLink, '_self')
        } else {
          alert('Please install Coinbase Wallet extension or use the mobile app')
        }
      }
    } catch (error) {
      console.error('Error connecting Coinbase Wallet:', error)
      alert('❌ Failed to connect Coinbase Wallet. Please try again.')
    }
  }

  const handleDisconnect = async () => {
    try {
      // Disconnect from AppKit if connected
      if (appKitConnected) {
        await disconnect()
      }
      
      // Clear local state
      setAddress('')
      setIsConnected(false)
      
      // Remove wallet from database
      await fetch('/api/user/wallet', {
        method: 'DELETE',
      })
      
      await update() // Refresh session
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  const currentWallet = session?.user?.walletAddress

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Wallet className="w-6 h-6 mr-2" />
            Wallet Connection
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Wallet Status */}
          {currentWallet && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Wallet</p>
                  <p className="font-mono text-sm text-white">
                    {currentWallet.slice(0, 6)}...{currentWallet.slice(-4)}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          )}

          {/* Wallet Options */}
          <div className="space-y-3">
            {!isConnected ? (
              <>
                <h3 className="text-lg font-medium text-white mb-4">Connect Your Wallet</h3>
                
                {/* WalletConnect - Main Option */}
                <button
                  onClick={connectWalletConnect}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] mb-4"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 mr-4">
                      <svg viewBox="0 0 40 40" className="w-full h-full">
                        <defs>
                          <linearGradient id="walletconnect-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B99FC"/>
                            <stop offset="100%" stopColor="#9945FF"/>
                          </linearGradient>
                        </defs>
                        <rect width="40" height="40" rx="20" fill="url(#walletconnect-gradient)"/>
                        <path fill="white" d="M12 18c4.4-4.3 11.6-4.3 16 0l.5.5c.2.2.2.5 0 .7l-1.8 1.8c-.1.1-.3.1-.4 0l-.7-.7c-3.1-3-8-3-11.1 0l-.8.8c-.1.1-.3.1-.4 0l-1.8-1.8c-.2-.2-.2-.5 0-.7L12 18zm19.8 3.7l1.6 1.6c.2.2.2.5 0 .7l-7.3 7.2c-.2.2-.5.2-.7 0l-5.2-5.1c0-.1-.1-.1-.2 0l-5.2 5.1c-.2.2-.5.2-.7 0l-7.3-7.2c-.2-.2-.2-.5 0-.7l1.6-1.6c.2-.2.5-.2.7 0l5.2 5.1c0 .1.1.1.2 0l5.2-5.1c.2-.2.5-.2.7 0l5.2 5.1c0 .1.1.1.2 0l5.2-5.1c.2-.2.5-.2.7 0z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Connect Wallet</div>
                      <div className="text-sm opacity-90">300+ Wallets Supported</div>
                    </div>
                  </div>
                  <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">Recommended</span>
                </button>

                <div className="text-center text-gray-400 text-sm mb-4">
                  <span>or connect directly</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* MetaMask */}
                  <button
                    onClick={connectMetaMask}
                    className="flex flex-col items-center px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 border border-gray-700 hover:border-orange-500"
                  >
                    <div className="w-8 h-8 mb-2">
                      <svg viewBox="0 0 1025 1025" className="w-full h-full">
                        <g clipPath="url(#clip0_542_3186)">
                          <path d="M862.005 871.546L689.114 820.065L558.73 898.006L467.763 897.968L337.303 820.065L164.488 871.546L111.92 694.087L164.488 497.133L111.92 330.613L164.488 124.233L434.526 285.567H591.967L862.005 124.233L914.573 330.613L862.005 497.133L914.573 694.087L862.005 871.546Z" fill="#FF5C16"/>
                          <path d="M164.527 124.233L434.566 285.68L423.826 396.479L164.527 124.233Z" fill="#FF5C16"/>
                          <path d="M337.34 694.163L456.155 784.672L337.34 820.065V694.163Z" fill="#FF5C16"/>
                          <path d="M446.659 544.525L423.823 396.554L277.65 497.169L277.574 497.132V497.207L278.026 600.776L337.302 544.525H337.34H446.659Z" fill="#FF5C16"/>
                          <path d="M862.005 124.233L591.967 285.68L602.669 396.479L862.005 124.233Z" fill="#FF5C16"/>
                          <path d="M689.19 694.163L570.375 784.672L689.19 820.065V694.163Z" fill="#FF5C16"/>
                          <path d="M748.922 497.207H748.96H748.922V497.132L748.884 497.169L602.711 396.554L579.875 544.525H689.194L748.508 600.776L748.922 497.207Z" fill="#FF5C16"/>
                          <path d="M337.303 820.062L164.488 871.544L111.92 694.16H337.303V820.062Z" fill="#E34807"/>
                          <path d="M446.623 544.487L479.634 758.4L433.886 639.463L277.953 600.776L337.267 544.487H446.586H446.623Z" fill="#E34807"/>
                          <path d="M689.188 820.062L862.003 871.544L914.571 694.16H689.188V820.062Z" fill="#E34807"/>
                          <path d="M579.87 544.487L546.859 758.4L592.607 639.463L748.54 600.776L689.189 544.487H579.87Z" fill="#E34807"/>
                          <path d="M111.92 694.085L164.488 497.131H277.538L277.952 600.737L433.886 639.424L479.633 758.361L456.119 784.556L337.304 694.047H111.92V694.085Z" fill="#FF8D5D"/>
                          <path d="M914.573 694.085L862.004 497.131H748.955L748.54 600.737L592.607 639.424L546.859 758.361L570.374 784.556L689.189 694.047H914.573V694.085Z" fill="#FF8D5D"/>
                          <path d="M591.969 285.567H513.249H434.528L423.826 396.366L479.635 758.25H546.862L602.709 396.366L591.969 285.567Z" fill="#FF8D5D"/>
                          <path d="M164.488 124.233L111.92 330.613L164.488 497.133H277.538L423.787 396.479L164.488 124.233Z" fill="#661800"/>
                          <path d="M413.951 587.451H362.739L334.854 614.781L433.923 639.349L413.951 587.413V587.451Z" fill="#661800"/>
                          <path d="M862.006 124.233L914.574 330.613L862.006 497.133H748.956L602.707 396.479L862.006 124.233Z" fill="#661800"/>
                          <path d="M612.617 587.451H663.904L691.79 614.819L592.607 639.424L612.617 587.413V587.451Z" fill="#661800"/>
                          <path d="M558.692 827.41L570.373 784.635L546.859 758.44H479.594L456.08 784.635L467.762 827.41" fill="#661800"/>
                          <path d="M558.689 827.407V898.043H467.76V827.407H558.689Z" fill="#C0C4CD"/>
                          <path d="M337.34 819.99L467.837 898.007V827.372L456.155 784.597L337.34 819.99Z" fill="#E7EBF6"/>
                          <path d="M689.19 819.99L558.693 898.007V827.372L570.375 784.597L689.19 819.99Z" fill="#E7EBF6"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_542_3186">
                            <rect width="1024" height="1024" fill="white" transform="translate(0.986328 0.5)"/>
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <span className="text-sm">MetaMask</span>
                  </button>

                  {/* Coinbase Wallet */}
                  <button
                    onClick={connectCoinbaseWallet}
                    className="flex flex-col items-center px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 border border-gray-700 hover:border-blue-500"
                  >
                    <div className="w-8 h-8 mb-2">
                      <svg viewBox="0 0 1024 1024" className="w-full h-full">
                        <circle cx="512" cy="512" r="512" fill="#0052ff"/>
                        <path d="M516.3 361.83c60.28 0 108.1 37.18 126.26 92.47H764C742 336.09 644.47 256 517.27 256 372.82 256 260 365.65 260 512.49S370 768 517.27 768c124.35 0 223.82-80.09 245.84-199.28H642.55c-17.22 55.3-65 93.45-125.32 93.45-83.23 0-141.56-63.89-141.56-149.68.04-86.77 57.43-150.66 140.63-150.66z" fill="#fff"/>
                      </svg>
                    </div>
                    <span className="text-sm">Coinbase</span>
                  </button>
                </div>

                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400 text-center">
                    🔒 Your wallet connection is secure and encrypted. We never store your private keys.
                  </p>
                </div>
              </>
            ) : null}

            {isConnected && address && (
              <div className="space-y-3">
                <div className="p-4 bg-green-800 rounded-lg border border-green-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Wallet Connected Successfully!
                    </div>
                    <button
                      onClick={onClose}
                      className="p-1 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-green-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 mb-1 text-center">Connected Wallet</p>
                  <p className="font-mono text-sm text-white text-center">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-sm text-gray-400 text-center space-y-2">
            <p>Connect your Ethereum wallet to access token-gated groups.</p>
            <p>Supported: MetaMask, mobile wallets, and manual entry.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
