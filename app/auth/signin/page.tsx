'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Twitter, MessageCircle } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleTwitterSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('twitter', { callbackUrl: '/' })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  const handleDemoSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('demo', { 
        username: 'demo',
        callbackUrl: '/' 
      })
    } catch (error) {
      console.error('Demo sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/hive.png"
              alt="HiveApp Logo"
              className="w-16 h-16 rounded-2xl object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.parentElement!.innerHTML = '<div class="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center"><svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 21 1.9-1.9a4.2 4.2 0 0 1 5.9-.5L13 20a6 6 0 0 0 6-6V6a6 6 0 0 0-6-6H6a6 6 0 0 0-6 6v14Z"></path><path d="M7 9h10"></path><path d="M7 13h6"></path></svg></div>'
              }}
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome to HiveApp
          </h2>
          <p className="text-dark-400 text-lg">
            Connect with Twitter to join token-gated communities
          </p>
        </div>

        <div className="card space-y-4">
          {/* Demo Login Button */}
          <button
            onClick={handleDemoSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
            ) : (
              <MessageCircle className="w-5 h-5 mr-3" />
            )}
            {isLoading ? 'Connecting...' : 'Demo Login (Test Features)'}
          </button>

          {/* Twitter Login Button */}
          <button
            onClick={handleTwitterSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
            ) : (
              <Twitter className="w-5 h-5 mr-3" />
            )}
            {isLoading ? 'Connecting...' : 'Continue with Twitter'}
          </button>

          <div className="mt-6 text-sm text-dark-400 text-center">
            <p>By signing in, you agree to our terms and privacy policy.</p>
            <p className="mt-2">Your Twitter handle will be used as your username.</p>
          </div>
        </div>

        <div className="text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-dark-400">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center mb-2">
                🔐
              </div>
              <span>Token Gated</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center mb-2">
                💬
              </div>
              <span>Group Chat</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center mb-2">
                📱
              </div>
              <span>Mobile Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
