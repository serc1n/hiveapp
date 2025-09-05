'use client'

import { Hash, Users, User } from 'lucide-react'

interface ModernMobileNavProps {
  activeTab: 'chats' | 'explore' | 'profile'
  onTabChange: (tab: 'chats' | 'explore' | 'profile') => void
}

export function ModernMobileNav({ activeTab, onTabChange }: ModernMobileNavProps) {
  const tabs = [
    { id: 'chats', label: 'Chats', icon: Hash },
    { id: 'explore', label: 'Explore', icon: Users },
    { id: 'profile', label: 'Profile', icon: User }
  ]

  return (
    <div className="bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-4 transition-all duration-200 ${
                isActive 
                  ? 'text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-indigo-100' : 'hover:bg-gray-100'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium mt-1 ${
                isActive ? 'text-indigo-600' : 'text-gray-600'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
