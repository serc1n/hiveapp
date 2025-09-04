'use client'

import { useState } from 'react'
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

  const connectWallet = async () => {
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
        console.error('Error connecting wallet:', error)
      }
    } else {
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // On mobile, try to open MetaMask app or suggest alternatives
        const metamaskAppUrl = `https://metamask.app.link/dapp/${window.location.host}`
        
        const userChoice = confirm(
          'To connect your wallet on mobile:\n\n' +
          '1. Open MetaMask app and browse to this site, OR\n' +
          '2. Use WalletConnect, OR\n' +
          '3. Enter your wallet address manually\n\n' +
          'Click OK to open MetaMask app, or Cancel to enter address manually.'
        )
        
        if (userChoice) {
          window.open(metamaskAppUrl, '_blank')
        } else {
          // Allow manual address entry
          const manualAddress = prompt('Enter your Ethereum wallet address:')
          if (manualAddress && manualAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            setAddress(manualAddress)
            setIsConnected(true)
          } else if (manualAddress) {
            alert('Please enter a valid Ethereum address (0x...)')
          }
        }
      } else {
        alert('Please install MetaMask or another Ethereum wallet extension')
      }
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

          {/* Connection Status */}
          <div className="text-center">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="w-full mb-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Connect Wallet
              </button>
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
