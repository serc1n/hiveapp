'use client'

import { useState, useEffect } from 'react'
import { X, UserCheck, UserX, Trash2, Users, Clock } from 'lucide-react'

interface JoinRequest {
  id: string
  userId: string
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    twitterHandle: string
    profileImage: string | null
  }
}

interface Member {
  id: string
  userId: string
  joinedAt: string
  user: {
    id: string
    name: string
    twitterHandle: string
    profileImage: string | null
  }
}

interface AdminPanelModalProps {
  groupId: string
  groupName: string
  onClose: () => void
}

export function AdminPanelModal({ groupId, groupName, onClose }: AdminPanelModalProps) {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminData()
  }, [groupId])

  const fetchAdminData = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/admin`)
      if (response.ok) {
        const data = await response.json()
        setJoinRequests(data.joinRequests)
        setMembers(data.members)
      } else {
        console.error('Failed to fetch admin data')
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRequest = async (userId: string, action: 'approve' | 'reject') => {
    setProcessingRequest(userId)
    try {
      const response = await fetch(`/api/groups/${groupId}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, userId }),
      })

      if (response.ok) {
        // Remove the processed request from the list
        setJoinRequests(prev => prev.filter(req => req.userId !== userId))
        
        if (action === 'approve') {
          // Refresh to get updated member list
          fetchAdminData()
        }
      } else {
        const error = await response.json()
        alert(`Failed to ${action} request: ${error.error}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      alert(`Failed to ${action} request`)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return
    }

    setRemovingMember(userId)
    try {
      const response = await fetch(`/api/groups/${groupId}/admin`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setMembers(prev => prev.filter(member => member.userId !== userId))
      } else {
        const error = await response.json()
        alert(`Failed to remove member: ${error.error}`)
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    } finally {
      setRemovingMember(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-modern">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-gray-600 text-sm">{groupName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pending Join Requests */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pending Join Requests ({joinRequests.length})
                  </h3>
                </div>
                
                {joinRequests.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No pending join requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {joinRequests.map((request) => (
                      <div key={request.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                            {request.user.profileImage ? (
                              <img
                                src={request.user.profileImage}
                                alt={request.user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-700 font-medium">
                                  {request.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">{request.user.name}</p>
                            <p className="text-gray-600 text-sm">@{request.user.twitterHandle}</p>
                            <p className="text-gray-500 text-xs">
                              Requested {formatDate(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleJoinRequest(request.userId, 'approve')}
                            disabled={processingRequest === request.userId}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleJoinRequest(request.userId, 'reject')}
                            disabled={processingRequest === request.userId}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Members */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Current Members ({members.length})
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                          {member.user.profileImage ? (
                            <img
                              src={member.user.profileImage}
                              alt={member.user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {member.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.user.name}</p>
                          <p className="text-gray-400 text-sm">@{member.user.twitterHandle}</p>
                          <p className="text-gray-500 text-xs">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={removingMember === member.userId}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
