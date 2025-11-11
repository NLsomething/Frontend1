import { useCallback, useEffect, useMemo, useState } from 'react'
import { USER_ROLES, USER_ROLE_LABELS } from '../../constants/roles'
import { getAllUsers, updateUserRole, deleteUser, updateUsername } from '../../services/userManagementService'
import { createProfile } from '../../services/profileService'
import { useNotifications } from '../../context/NotificationContext'
import '../../styles/HomePageStyle/UserManagementStyle.css'

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

const resolveRoleVariant = (role) => {
  if (!role || role === 'No role') return 'none'
  if (role === USER_ROLES.administrator) return 'administrator'
  if (role === USER_ROLES.buildingManager) return 'manager'
  if (role === USER_ROLES.teacher) return 'teacher'
  if (role === USER_ROLES.student) return 'default'
  return 'default'
}

const resolveRoleLabel = (role) => {
  if (!role || role === 'No role') return 'No Profile'
  return USER_ROLE_LABELS[role] || role
}

export const UserManagementContent = ({ currentUserId }) => {
  const { notifySuccess, notifyError } = useNotifications()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getAllUsers()
    if (error) {
      notifyError('Failed to load users', { description: error })
      setUsers([])
    } else {
      setUsers(Array.isArray(data) ? data : [])
    }
    setLoading(false)
  }, [notifyError])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleEditUser = (user) => {
    setEditingUser(user)
    setEditForm({
      username: user?.username === 'No username' ? '' : (user?.username || ''),
      role: user?.role === 'No role' ? USER_ROLES.student : (user?.role || USER_ROLES.student)
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

      resetEditState()
      await loadUsers()
    } catch (error) {
      notifyError('Failed to update user', { description: formatError(error) })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (user) => {
    if (user.id === currentUserId) {
      notifyError('Cannot delete yourself', { description: 'You cannot delete your own account.' })
      return
    }

    const hasProfile = user.role !== 'No role'
    const confirmMessage = hasProfile
      ? `Are you sure you want to delete ${user.username || 'this user'}? This will remove their profile and they will need to be re-invited.`
      : `Are you sure you want to delete ${user.username || 'this user'}? This is a permanent action.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setLoading(true)

    try {
      const { error } = await deleteUser(user.id)
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
      filtered = filtered.filter((user) =>
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      )
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }
    
    return filtered
  }, [searchQuery, roleFilter, users])

  const busy = loading

  return (
    <div className={`um-panel ${busy ? 'busy' : ''}`}>
      <div className="um-search">
        <div className="um-search-container">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="um-control um-input um-search-input"
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="um-control um-select um-role-filter"
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

      <div className="um-body">
        {busy && users.length === 0 ? (
          <div className="um-empty loading">
            Loading users…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="um-empty">No users found</div>
        ) : (
          <div className="um-list">
            {filteredUsers.map((user) => {
              const isEditing = editingUser?.id === user.id
              const requiresProfile = user.role === 'No role'
              const roleVariant = resolveRoleVariant(user.role)
              const roleLabel = resolveRoleLabel(user.role)
              const createdLabel = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'
              const isCurrentUser = user.id === currentUserId

              return (
                <article
                  key={user.id}
                  className={`um-card
                  ${isEditing ? 'editing' : 'view'}`}
                >
                  {isEditing ? (
                    <div className="um-edit">
                      {requiresProfile && (
                        <div className="um-alert" data-variant="profile">
                          <div className="um-alert-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="um-alert-content">
                            <span className="um-alert-title">Creating profile</span>
                            <p className="um-alert-text">This user has no profile. Provide a username and select a role to create one.</p>
                          </div>
                        </div>
                      )}

                      <div className="um-edit-grid">
                        <div className="um-field">
                          <label className="um-label" htmlFor={`um-username-${user.id}`}>
                            Username{' '}
                            {requiresProfile && <span className="um-required">*</span>}
                          </label>
                          <input
                            id={`um-username-${user.id}`}
                            type="text"
                            value={editForm.username}
                            onChange={(event) => setEditForm({ ...editForm, username: event.target.value })}
                            placeholder={requiresProfile ? 'Enter username' : 'Update username'}
                            className="um-control um-input"
                          />
                        </div>
                        <div className="um-field">
                          <label className="um-label" htmlFor={`um-role-${user.id}`}>
                            Role {requiresProfile && <span className="um-required">*</span>}
                          </label>
                          <select
                            id={`um-role-${user.id}`}
                            value={editForm.role}
                            onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}
                            className="um-control um-select"
                          >
                            {Object.entries(USER_ROLES).map(([, value]) => (
                              <option key={value} value={value}>
                                {USER_ROLE_LABELS[value]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="um-card-actions">
                        <button
                          type="button"
                          className="um-button secondary"
                          onClick={resetEditState}
                          disabled={busy}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={`um-button
                          ${requiresProfile ? 'success': 'primary'}`}
                          onClick={handleSaveEdit}
                          disabled={busy || (requiresProfile && !editForm.username.trim())}
                        >
                          {requiresProfile ? 'Create Profile' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="um-view">
                      <div className="um-user">
                        <div className="um-user-header">
                          <h3 className="um-user-name">{user.username || 'No username'}</h3>
                          <div className="um-tag-group">
                            <span className={`um-tag ${roleVariant}`}>
                              {roleLabel}
                            </span>
                            {isCurrentUser && (
                              <span className="um-tag self">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="um-user-details">
                          {user.email && user.email !== 'No email' && (
                            <p className="um-user-email">{user.email}</p>
                          )}
                          <p className="um-user-meta">Created: {createdLabel}</p>
                        </div>
                      </div>
                      <div className="um-actions">
                        <button
                          type="button"
                          className="um-button primary"
                          onClick={() => handleEditUser(user)}
                          disabled={busy}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="um-button danger"
                          onClick={() => handleDeleteUser(user)}
                          disabled={busy || isCurrentUser}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

