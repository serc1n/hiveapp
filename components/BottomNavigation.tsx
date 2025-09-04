'use client'

import { useState } from 'react'
import { Hash, Search, User } from 'lucide-react'

interface BottomNavigationProps {
  activeTab: 'my-hives' | 'explore' | 'profile'
  onTabChange: (tab: 'my-hives' | 'explore' | 'profile') => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 px-4 py-3 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => onTabChange('my-hives')}
          className={`flex flex-col items-center space-y-1 px-6 py-3 transition-colors font-bold ${
            activeTab === 'my-hives'
              ? 'text-white bg-gray-800'
              : 'text-gray-500 hover:text-white hover:bg-gray-900'
          }`}
        >
          <svg className="w-6 h-6" fill={activeTab === 'my-hives' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-medium">Hives</span>
        </button>
        
        <button
          onClick={() => onTabChange('explore')}
          className={`flex flex-col items-center space-y-1 px-6 py-3 transition-colors font-bold ${
            activeTab === 'explore'
              ? 'text-white bg-gray-800'
              : 'text-gray-500 hover:text-white hover:bg-gray-900'
          }`}
        >
          <svg className="w-6 h-6" fill={activeTab === 'explore' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs font-medium">Explore</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 transition-colors font-bold ${
            activeTab === 'profile'
              ? 'text-white bg-gray-800'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </div>
  )
}
