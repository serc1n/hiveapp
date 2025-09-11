'use client'

import { Hash, Users, User, Plus, Search } from 'lucide-react'
import { HiveLogo } from './HiveLogo'
import { buttonPress, selectionFeedback } from '../lib/haptics'

interface AppBottomNavigationProps {
  activeTab: 'chats' | 'explore' | 'profile'
  onTabChange: (tab: 'chats' | 'explore' | 'profile') => void
  onCreateHive?: () => void
}

export function AppBottomNavigation({ activeTab, onTabChange, onCreateHive }: AppBottomNavigationProps) {
  const tabs = [
    { id: 'chats', label: 'Chats', icon: Hash, useCustomIcon: true },
    { id: 'explore', label: 'Explore', icon: Users },
    { id: 'profile', label: 'Profile', icon: User }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      {/* Tab Bar */}
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isActive) {
                  selectionFeedback()
                  onTabChange(tab.id as any)
                }
              }}
              className={`flex flex-col items-center justify-center py-2 px-4 min-w-0 flex-1 transition-all duration-200 haptic-light ${
                isActive 
                  ? 'text-indigo-600' 
                  : 'text-gray-500'
              }`}
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-100 transform scale-105' 
                  : 'hover:bg-gray-100'
              }`}>
                {tab.useCustomIcon && tab.id === 'chats' ? (
                  <HiveLogo className={`w-6 h-6 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                ) : (
                  <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                )}
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <span className={`text-xs font-medium mt-1 transition-all duration-200 ${
                isActive 
                  ? 'text-indigo-600 font-semibold' 
                  : 'text-gray-500'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
        
        {/* Floating Action Button for Create Hive */}
        {activeTab === 'chats' && onCreateHive && (
          <button
            onClick={() => {
              buttonPress('medium')
              onCreateHive()
            }}
            className="absolute -top-6 right-4 w-14 h-14 bg-gradient-primary hover:shadow-lg text-white rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg border-4 border-white haptic-medium"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  )
}
