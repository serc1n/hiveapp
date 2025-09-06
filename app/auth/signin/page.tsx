'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Twitter, MessageCircle, Sparkles, Users, Shield } from 'lucide-react'
import { HiveLogo } from '@/components/HiveLogo'

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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-25"></div>
              <div className="relative bg-white rounded-3xl p-4 shadow-xl border border-gray-100">
                <HiveLogo className="w-12 h-12 text-purple-600" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent mb-3">
            Welcome to Hive
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
            Connect with <span className="font-semibold text-gray-800">𝕏</span> to join exclusive token-gated communities
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 space-y-6">
          {/* Demo Login Button */}
          <button
            onClick={handleDemoSignIn}
            disabled={isLoading}
            className="group w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
              ) : (
                <MessageCircle className="w-5 h-5 mr-3" />
              )}
              <span>{isLoading ? 'Connecting...' : 'Demo Login (Test Features)'}</span>
            </div>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500 font-medium">or</span>
            </div>
          </div>

          {/* X (Twitter) Login Button */}
          <button
            onClick={handleTwitterSignIn}
            disabled={isLoading}
            className="group w-full relative overflow-hidden bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
              ) : (
                <div className="w-5 h-5 mr-3 flex items-center justify-center">
                  <span className="text-lg font-bold">𝕏</span>
                </div>
              )}
              <span>{isLoading ? 'Connecting...' : 'Continue with 𝕏'}</span>
            </div>
          </button>

          {/* Terms and Privacy */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <span className="text-purple-600 font-medium cursor-pointer hover:text-purple-700 transition-colors">
                terms
              </span>{' '}
              and{' '}
              <span className="text-purple-600 font-medium cursor-pointer hover:text-purple-700 transition-colors">
                privacy policy
              </span>
            </p>
            <p className="text-xs text-gray-400">
              Your 𝕏 handle will be used as your username
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Token Gated</h3>
              <p className="text-xs text-gray-500 mt-1">Exclusive access</p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Communities</h3>
              <p className="text-xs text-gray-500 mt-1">Connect & chat</p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Modern</h3>
              <p className="text-xs text-gray-500 mt-1">PWA ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
