import { useState, useEffect } from 'react'
import { USER_ROLES, USER_ROLE_LABELS } from '../constants/roles'
import { getAllUsers, updateUserRole, deleteUser, updateUsername } from '../services/userManagementService'
import { createProfile } from '../services/profileService'
import { useNotifications } from '../context/NotificationContext'

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
          className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-800">User Management</h2>
              <p className="text-sm text-slate-500 mt-1">Manage user accounts and roles</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-slate-200">
            <input
              type="text"
              placeholder="Search by username, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && !users.length ? (
              <div className="text-center py-12 text-slate-500">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No users found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    {editingUser?.id === user.id ? (
                      // Edit Mode (or Create Profile Mode)
                      <div className="space-y-3">
                        {user.role === 'No role' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 text-blue-700">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-semibold">Creating Profile</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              This user has no profile. Enter username and select a role to create one.
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Username {user.role === 'No role' && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                              placeholder={user.role === 'No role' ? 'Enter username' : ''}
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Role {user.role === 'No role' && <span className="text-red-500">*</span>}
                            </label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              {Object.entries(USER_ROLES).map(([, value]) => (
                                <option key={value} value={value}>
                                  {USER_ROLE_LABELS[value]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded transition"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className={`px-4 py-2 text-sm rounded transition disabled:opacity-50 ${
                              user.role === 'No role'
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
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
                            <h3 className="font-semibold text-slate-800">
                              {user.username || 'No username'}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              user.role === 'No role'
                                ? 'bg-red-100 text-red-700'
                                : user.role === USER_ROLES.administrator
                                ? 'bg-purple-100 text-purple-700'
                                : user.role === USER_ROLES.buildingManager
                                ? 'bg-blue-100 text-blue-700'
                                : user.role === USER_ROLES.teacher
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.role === 'No role' ? 'No Profile' : USER_ROLE_LABELS[user.role]}
                            </span>
                            {user.id === currentUserId && (
                              <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {user.email && user.email !== 'No email' && (
                              <p className="text-sm text-slate-500">{user.email}</p>
                            )}
                            <p className="text-xs text-slate-400">
                              ID: {user.id.slice(0, 8)}... • Created: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1.5 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition"
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username, user.role !== 'No role')}
                            className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition disabled:opacity-50"
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Total Users: {filteredUsers.length}</span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserManagementModal
