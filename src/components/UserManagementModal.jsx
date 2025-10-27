import { useState, useEffect } from 'react'
import { USER_ROLES, USER_ROLE_LABELS } from '../constants/roles'
import { getAllUsers, updateUserRole, deleteUser, updateUsername } from '../services/userManagementService'
import { createProfile } from '../services/profileService'
import { useNotifications } from '../context/NotificationContext'
import { COLORS } from '../constants/colors'

function UserManagementModal({ isOpen, onClose, currentUserId }) {
  const { notifySuccess, notifyError } = useNotifications()
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ username: '', role: '' })

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await getAllUsers()
    
    if (error) {
      notifyError('Failed to load users', { description: error })
    } else {
      setUsers(data || [])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleEditUser = (user) => {
    setEditingUser(user)
    
    // For users without profiles, default to student role
    setEditForm({
      username: user.username === 'No username' ? '' : user.username,
      role: user.role === 'No role' ? USER_ROLES.student : user.role
    })
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    setLoading(true)

    // If user has no profile, create one
    if (editingUser.role === 'No role') {
      try {
        const { error } = await createProfile({
          id: editingUser.id,
          username: editForm.username || 'User',
          role: editForm.role
        })

        if (error) {
          notifyError('Failed to create profile', { description: error })
          setLoading(false)
          return
        }

        notifySuccess('Profile created successfully')
        setEditingUser(null)
        await loadUsers()
        setLoading(false)
        return
      } catch (error) {
        notifyError('Failed to create profile', { description: error.message })
        setLoading(false)
        return
      }
    }

    // Otherwise, update existing profile
    // Update username if changed
    if (editForm.username !== editingUser.username) {
      const { error } = await updateUsername(editingUser.id, editForm.username)
      if (error) {
        notifyError('Failed to update username', { description: error })
        setLoading(false)
        return
      }
    }

    // Update role if changed
    if (editForm.role !== editingUser.role) {
      const { error } = await updateUserRole(editingUser.id, editForm.role)
      if (error) {
        notifyError('Failed to update role', { description: error })
        setLoading(false)
        return
      }
    }

    notifySuccess('User updated successfully')
    setEditingUser(null)
    await loadUsers()
    setLoading(false)
  }

  const handleDeleteUser = async (userId, username, hasProfile) => {
    if (userId === currentUserId) {
      notifyError('Cannot delete yourself', { description: 'You cannot delete your own account.' })
      return
    }

    const confirmMessage = hasProfile 
      ? `Are you sure you want to delete user "${username}"? This will delete both the profile and auth account. This action cannot be undone.`
      : `Are you sure you want to delete this auth user (${username})? This user has no profile. This action cannot be undone.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    const { error } = await deleteUser(userId)
    
    if (error) {
      notifyError('Failed to delete user', { description: error })
    } else {
      notifySuccess('User deleted successfully')
      await loadUsers()
    }
    
    setLoading(false)
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    return (
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    )
  })

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col pointer-events-auto"
          style={{ backgroundColor: COLORS.black }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(238,238,238,0.2)' }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: COLORS.white }}>User Management</h2>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm font-medium transition-colors duration-150 rounded"
              style={{ border: '1px solid rgba(238,238,238,0.2)', color: COLORS.white, backgroundColor: COLORS.darkGray }}
            >
              Close
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(238,238,238,0.2)' }}>
            <input
              type="text"
              placeholder="Search by username, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058'
              }}
            />
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3282B8 #222831' }}>
            {loading && !users.length ? (
              <div className="text-center py-12" style={{ color: COLORS.whiteTransparentMid }}>
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12" style={{ color: COLORS.whiteTransparentMid }}>
                No users found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-lg p-4 transition"
                    style={{ 
                      border: '1px solid rgba(238,238,238,0.2)', 
                      backgroundColor: COLORS.darkGray 
                    }}
                  >
                    {editingUser?.id === user.id ? (
                      // Edit Mode (or Create Profile Mode)
                      <div className="space-y-3">
                        {user.role === 'No role' && (
                          <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'rgba(50, 130, 184, 0.1)', border: '1px solid #3282B8' }}>
                            <div className="flex items-center gap-2" style={{ color: COLORS.blue }}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-semibold">Creating Profile</span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: '#4BA3D3' }}>
                              This user has no profile. Enter username and select a role to create one.
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.whiteTransparentMid }}>
                              Username {user.role === 'No role' && <span style={{ color: '#ef4444' }}>*</span>}
                            </label>
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                              placeholder={user.role === 'No role' ? 'Enter username' : ''}
                              className="w-full px-3 py-2 rounded text-sm"
                              style={{ 
                                border: '1px solid rgba(238,238,238,0.2)',
                                color: COLORS.white,
                                backgroundColor: '#4A5058'
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.whiteTransparentMid }}>
                              Role {user.role === 'No role' && <span style={{ color: '#ef4444' }}>*</span>}
                            </label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              className="w-full px-3 py-2 rounded text-sm"
                              style={{ 
                                border: '1px solid rgba(238,238,238,0.2)',
                                color: COLORS.white,
                                backgroundColor: '#4A5058'
                              }}
                            >
                              {Object.entries(USER_ROLES).map(([, value]) => (
                                <option key={value} value={value} style={{ backgroundColor: '#4A5058' }}>
                                  {USER_ROLE_LABELS[value]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(null)}
                            style={{ 
                              border: '1px solid rgba(238,238,238,0.2)', 
                              color: COLORS.white,
                              backgroundColor: '#4A5058'
                            }}
                            className="px-4 py-2 text-sm rounded transition"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            style={{ 
                              backgroundColor: user.role === 'No role' ? '#10b981' : COLORS.blue,
                              color: COLORS.white,
                              border: '1px solid transparent'
                            }}
                            className="px-4 py-2 text-sm rounded transition disabled:opacity-50"
                            disabled={loading || (user.role === 'No role' && !editForm.username.trim())}
                          >
                            {user.role === 'No role' ? 'Create Profile' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold" style={{ color: COLORS.white }}>
                              {user.username || 'No username'}
                            </h3>
                            {(() => {
                              let roleStyle = {
                                backgroundColor: '#6B7280',
                                color: '#FFFFFF',
                                borderColor: '#6B7280'
                              }
                              
                              if (user.role === USER_ROLES.administrator) {
                                roleStyle = {
                                  backgroundColor: '#ef4444',
                                  color: '#FFFFFF',
                                  borderColor: '#ef4444'
                                }
                              } else if (user.role === USER_ROLES.buildingManager) {
                                roleStyle = {
                                  backgroundColor: COLORS.blue,
                                  color: '#FFFFFF',
                                  borderColor: COLORS.blue
                                }
                              } else if (user.role === USER_ROLES.teacher) {
                                roleStyle = {
                                  backgroundColor: 'rgb(5, 150, 105)',
                                  color: '#FFFFFF',
                                  borderColor: 'rgb(5, 150, 105)'
                                }
                              } else if (user.role === 'No role') {
                                roleStyle = {
                                  backgroundColor: '#ef4444',
                                  color: '#FFFFFF',
                                  borderColor: '#ef4444'
                                }
                              }
                              
                              return (
                                <span 
                                  className="px-2 py-1 text-xs font-semibold rounded border"
                                  style={{ backgroundColor: roleStyle.backgroundColor, color: roleStyle.color, border: `1px solid ${roleStyle.borderColor}` }}
                                >
                                  {user.role === 'No role' ? 'No Profile' : USER_ROLE_LABELS[user.role]}
                                </span>
                              )
                            })()}
                            {user.id === currentUserId && (
                              <span 
                                className="px-2 py-1 text-xs font-semibold rounded border"
                                style={{ backgroundColor: '#f59e0b', color: '#FFFFFF', border: '1px solid #f59e0b' }}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {user.email && user.email !== 'No email' && (
                              <p className="text-sm" style={{ color: COLORS.whiteTransparentMid }}>{user.email}</p>
                            )}
                            <p className="text-xs" style={{ color: COLORS.whiteTransparentLow }}>
                              Created: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1.5 text-sm border rounded transition disabled:opacity-50"
                            style={{ border: '1px solid rgba(238,238,238,0.2)', color: '#FFFFFF', backgroundColor: COLORS.blue }}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username, user.role !== 'No role')}
                            className="px-3 py-1.5 text-sm border rounded transition disabled:opacity-50"
                            style={{ border: '1px solid rgba(238,238,238,0.2)', color: '#FFFFFF', backgroundColor: '#ef4444' }}
                            disabled={loading || user.id === currentUserId}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

export default UserManagementModal
