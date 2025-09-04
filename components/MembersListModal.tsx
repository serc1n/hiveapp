'use client'

import { X } from 'lucide-react'

interface Member {
  id: string
  name: string
  twitterHandle: string
  profileImage: string | null
  joinedAt: string
}

interface MembersListModalProps {
  members: Member[]
  groupName: string
  onClose: () => void
}

export function MembersListModal({ members, groupName, onClose }: MembersListModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">
            {groupName} Members ({members.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3">
                {member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-black truncate">{member.name}</p>
                  <p className="text-sm text-gray-500 truncate">@{member.twitterHandle}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
