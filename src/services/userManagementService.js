import { supabase } from '../lib/supabaseClient'

/**
 * Get all users with their profiles
 * Requires administrator role
 * @returns {Promise<{data, error}>}
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_users')

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} newRole - New role
 * @returns {Promise<{error}>}
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { error: error.message }
  }
}

/**
 * Delete user (requires admin privileges)
 * Deletes both profile and auth.users entry
 * @param {string} userId - User ID to delete
 * @returns {Promise<{error}>}
 */
export const deleteUser = async (userId) => {
  try {
    // Use the database function to delete user (handles both profile and auth.users)
    const { error } = await supabase
      .rpc('delete_user', { user_id: userId })

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { error: error.message }
  }
}

/**
 * Update username
 * @param {string} userId - User ID
 * @param {string} newUsername - New username
 * @returns {Promise<{error}>}
 */
export const updateUsername = async (userId, newUsername) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error updating username:', error)
    return { error: error.message }
  }
}
