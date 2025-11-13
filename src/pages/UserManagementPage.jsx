import { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES, USER_ROLE_LABELS } from '../constants/roles'
import { getAllUsers, updateUserRole, deleteUser, updateUsername } from '../services/userManagementService'
import { createProfile } from '../services/profileService'
import { useNotifications } from '../context/NotificationContext'
import '../styles/UserManagementPageStyle.css'

const INITIAL_EDIT_FORM = {
  username: '',
  role: USER_ROLES.student
}

const formatError = (error) => {
  if (!error) return 'An unexpected error occurred.'
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    return error.description || error.message || JSON.stringify(error)
  }
  return String(error)
}

const resolveRoleLabel = (role) => {
  if (!role || role === 'No role') return 'No Profile'
  return USER_ROLE_LABELS[role] || role
}

function UserManagementPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { notifySuccess, notifyError } = useNotifications()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [authLoading, user, navigate])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await getAllUsers()
      if (error) {
        notifyError('Failed to load users', { description: error })
        setUsers([])
      } else {
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      notifyError('Failed to load users', { description: formatError(error) })
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleEditUser = (userData) => {
    setEditingUser(userData)
    setEditForm({
      username: userData?.username === 'No username' ? '' : (userData?.username || ''),
      role: userData?.role === 'No role' ? USER_ROLES.student : (userData?.role || USER_ROLES.student)
    })
  }

  const resetEditState = () => {
    setEditingUser(null)
    setEditForm(INITIAL_EDIT_FORM)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    setLoading(true)
    const usernameValue = editForm.username.trim()
    const currentUsername = editingUser.username === 'No username' ? '' : editingUser.username

    try {
      if (editingUser.id === user?.id) {
        if (usernameValue !== currentUsername) {
          const res = await updateUsername(editingUser.id, usernameValue)
          if (res?.error) throw res.error
          notifySuccess('Name updated successfully')
        } else {
          notifySuccess('No changes to save')
        }
      } else {
        if (editingUser.role === 'No role') {
          const { error } = await createProfile({
            id: editingUser.id,
            username: usernameValue || 'User',
            role: editForm.role
          })

          if (error) {
            throw error
          }

          notifySuccess('Profile created successfully')
        } else {
          const updateTasks = []

          if (usernameValue !== currentUsername) {
            updateTasks.push(updateUsername(editingUser.id, usernameValue))
          }

          if (editForm.role !== editingUser.role) {
            updateTasks.push(updateUserRole(editingUser.id, editForm.role))
          }

          if (updateTasks.length > 0) {
            const results = await Promise.all(updateTasks)
            const failure = results.find((result) => result?.error)

            if (failure?.error) {
              throw failure.error
            }

            notifySuccess('User updated successfully')
          } else {
            notifySuccess('No changes to save')
          }
        }
      }

      resetEditState()
      await loadUsers()
    } catch (error) {
      notifyError('Failed to update user', { description: formatError(error) })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userData) => {
    if (userData.id === user?.id) {
      notifyError('Cannot delete yourself', { description: 'You cannot delete your own account.' })
      return
    }

    const hasProfile = userData.role !== 'No role'
    const confirmMessage = hasProfile
      ? `Are you sure you want to delete ${userData.username || 'this user'}? This will remove their profile and they will need to be re-invited.`
      : `Are you sure you want to delete ${userData.username || 'this user'}? This is a permanent action.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setLoading(true)

    try {
      const { error } = await deleteUser(userData.id)
      if (error) {
        throw error
      }

      notifySuccess('User deleted successfully')
      await loadUsers()
    } catch (error) {
      notifyError('Failed to delete user', { description: formatError(error) })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    
    let filtered = users
    
    if (query) {
      filtered = filtered.filter(
        (userData) =>
          userData.username?.toLowerCase().includes(query) ||
          userData.email?.toLowerCase().includes(query)
      )
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter((userData) => userData.role === roleFilter)
    }
    
    return filtered
  }, [searchQuery, roleFilter, users])

  if (authLoading) {
    return (
      <div className="ump-screen">
        <div className="ump-loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="ump-screen">
       <div className="ump-outter">
        <div className="ump-container">
            {/* Header */}
            <div className="ump-header">
            <div className="ump-header-content">
                <h1 className="ump-title">User Management</h1>
                <button
                onClick={() => navigate(-1)}
                className="ump-back-button"
                >
                Back
                </button>
            </div>
            </div>

            {/* Search and Filter */}
            <div className="ump-search-section">
            <div className="ump-search-container">
                <input
                type="text"
                placeholder="Filter members"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ump-search-input"
                />
                <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="ump-role-filter"
                >
                <option value="all">All Roles</option>
                {Object.entries(USER_ROLES).map(([, value]) => (
                    <option key={value} value={value}>
                    {USER_ROLE_LABELS[value]}
                    </option>
                ))}
                </select>
            </div>
            </div>

            {/* Table Header */}
            <div className="ump-table">
            <div className="ump-table-header">
                <div className="ump-col-user">USER</div>
                <div className="ump-col-role">ROLE</div>
                <div className="ump-col-created">CREATED</div>
                <div className="ump-col-actions">ACTIONS</div>
            </div>

            {/* Table Body */}
            <div className="ump-table-body">
                {loading && users.length === 0 ? (
                <div className="ump-loading-message">Loading users…</div>
                ) : filteredUsers.length === 0 ? (
                <div className="ump-empty-message">No users found</div>
                ) : (
                filteredUsers.map((userData) => (
                    <div key={userData.id} className={`ump-table-row ${editingUser?.id === userData.id ? 'editing' : ''}`}>
                    {editingUser?.id === userData.id ? (
                        // Edit Mode
                        <>
                        <div className="ump-col-user">
                            <div className="ump-edit-fields">
                            <input
                                type="text"
                                value={editForm.username}
                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                placeholder="Username"
                                className="ump-input"
                            />
                            </div>
                        </div>
                        <div className="ump-col-role">
                            {editingUser?.id === user?.id ? (
                            <span className={`ump-role-badge ump-role-${userData.role?.toLowerCase() || 'none'}`}>
                                {resolveRoleLabel(userData.role)}
                            </span>
                            ) : (
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="ump-select"
                            >
                                {Object.entries(USER_ROLES).map(([, value]) => (
                                <option key={value} value={value}>
                                    {USER_ROLE_LABELS[value]}
                                </option>
                                ))}
                            </select>
                            )}
                        </div>
                        <div className="ump-col-created">
                            {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : '—'}
                        </div>
                        <div className="ump-col-actions">
                            <div className="ump-action-buttons">
                            <button
                                onClick={handleSaveEdit}
                                disabled={loading}
                                className="ump-btn ump-btn-save"
                            >
                                Save
                            </button>
                            <button
                                onClick={resetEditState}
                                disabled={loading}
                                className="ump-btn ump-btn-cancel"
                            >
                                Cancel
                            </button>
                            </div>
                        </div>
                        </>
                    ) : (
                        // View Mode
                        <>
                        <div className="ump-col-user">
                            <div className="ump-user-info">
                            <div className="ump-username">
                                {userData.username}
                                {userData.id === user?.id && <span className="ump-you-badge">You</span>}
                            </div>
                            <div className="ump-email">{userData.email}</div>
                            </div>
                        </div>
                        <div className="ump-col-role">
                            <span className={`ump-role-badge ump-role-${userData.role?.toLowerCase() || 'none'}`}>
                            {resolveRoleLabel(userData.role)}
                            </span>
                        </div>
                        <div className="ump-col-created">
                            <span style={{ color: '#eeeeee' }}>{userData.created_at ? new Date(userData.created_at).toLocaleDateString() : '—'}</span>
                        </div>
                        <div className="ump-col-actions">
                            <div className="ump-action-buttons">
                            {userData.id === user?.id ? (
                                <button
                                onClick={() => handleEditUser(userData)}
                                disabled={loading}
                                className="ump-btn ump-btn-change"
                                >
                                Change name
                                </button>
                            ) : (
                                <>
                                <button
                                    onClick={() => handleEditUser(userData)}
                                    disabled={loading}
                                    className="ump-btn ump-btn-edit"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(userData)}
                                    disabled={loading || userData.id === user?.id}
                                    className="ump-btn ump-btn-delete"
                                >
                                    Delete
                                </button>
                                </>
                            )}
                            </div>
                        </div>
                        </>
                    )}
                    </div>
                ))
                )}
            </div>
            </div>

            {/* Footer */}
            <div className="ump-footer">
            <div className="ump-user-count">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagementPage
