'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, Wallet, CheckCircle, AlertCircle } from 'lucide-react'

interface WalletConnectionProps {
  onClose: () => void
}

export function WalletConnection({ onClose }: WalletConnectionProps) {
  const { data: session, update } = useSession()
  const [address, setAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle')

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
      // Simple WalletConnect implementation
      alert('🔗 WalletConnect\n\nThis will show a QR code to connect with mobile wallets like:\n\n• Trust Wallet\n• Rainbow\n• Coinbase Wallet\n• And 300+ other wallets\n\nFeature coming soon!')
    } catch (error) {
      console.error('Error connecting with WalletConnect:', error)
      alert('❌ Failed to connect with WalletConnect. Please try again.')
    }
  }

  const connectCoinbaseWallet = async () => {
    try {
      // Check for Coinbase Wallet
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isCoinbaseWallet) {
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
                <h3 className="text-lg font-medium text-white mb-4">Choose Your Wallet</h3>
                
                {/* MetaMask */}
                <button
                  onClick={connectMetaMask}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                      <span className="text-orange-500 font-bold text-lg">🦊</span>
                    </div>
                    <span>MetaMask</span>
                  </div>
                  <span className="text-sm opacity-90">Most Popular</span>
                </button>

                {/* Coinbase Wallet */}
                <button
                  onClick={connectCoinbaseWallet}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-500 font-bold text-lg">💼</span>
                    </div>
                    <span>Coinbase Wallet</span>
                  </div>
                  <span className="text-sm opacity-90">Easy & Secure</span>
                </button>

                {/* WalletConnect */}
                <button
                  onClick={connectWalletConnect}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-500 font-bold text-lg">🔗</span>
                    </div>
                    <span>WalletConnect</span>
                  </div>
                  <span className="text-sm opacity-90">300+ Wallets</span>
                </button>

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
