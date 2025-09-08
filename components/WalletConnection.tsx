'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, Wallet, CheckCircle, AlertCircle } from 'lucide-react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

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

  // Sync AppKit state with local state
  useEffect(() => {
    if (appKitConnected && appKitAddress) {
      setAddress(appKitAddress)
      setIsConnected(true)
    } else {
      if (!address) { // Only clear if we don't have a manual address
        setIsConnected(false)
      }
    }
  }, [appKitConnected, appKitAddress, address])

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
      // Open AppKit modal
      await open()
    } catch (error) {
      console.error('Error opening WalletConnect modal:', error)
      alert('❌ Failed to open wallet connection modal. Please try again.')
    }
  }

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700">
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
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-4">
                      <span className="text-blue-500 font-bold text-xl">🔗</span>
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
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mb-2">
                      <span className="text-orange-500 font-bold text-lg">🦊</span>
                    </div>
                    <span className="text-sm">MetaMask</span>
                  </button>

                  {/* Coinbase Wallet */}
                  <button
                    onClick={connectCoinbaseWallet}
                    className="flex flex-col items-center px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 border border-gray-700 hover:border-blue-500"
                  >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mb-2">
                      <span className="text-blue-500 font-bold text-lg">💼</span>
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
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Connected Wallet</p>
                  <p className="font-mono text-sm text-white">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>

                {updateStatus === 'success' && (
                  <div className="flex items-center justify-center text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Wallet updated successfully!
                  </div>
                )}

                {updateStatus === 'error' && (
                  <div className="flex items-center justify-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Failed to update wallet
                  </div>
                )}

                <div className="flex space-x-3">
                  {currentWallet !== address && (
                    <button
                      onClick={handleSaveWallet}
                      disabled={isUpdating || updateStatus === 'success'}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      {isUpdating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : (
                        'Save Wallet'
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
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
