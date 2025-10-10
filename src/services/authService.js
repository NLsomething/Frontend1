import { supabase } from '../lib/supabaseClient'
import { createProfile, upsertProfile } from './profileService'
import { USER_ROLES } from '../constants/roles'

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {object} metadata - Additional user metadata (optional)
 * @returns {Promise<{user, session, error}>}
 */
export const signUp = async (email, password, metadata = {}, role = USER_ROLES.student) => {
  try {
    const userMetadata = { ...metadata, role }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata
      }
    })

    if (error) throw error

    if (data?.user?.id) {
      try {
        await createProfile({
          id: data.user.id,
          username: metadata?.username,
          role
        })
      } catch (profileError) {
        console.error('Profile creation error:', profileError?.message || profileError)
      }
    }

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing up:', error.message)
    return { user: null, session: null, error: error.message }
  }
}

/**
 * Sign in a user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{user, session, error}>}
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing in:', error.message)
    return { user: null, session: null, error: error.message }
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error.message)
    return { error: error.message }
  }
}

/**
 * Get the current user session
 * @returns {Promise<{session, error}>}
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) throw error

    return { session, error: null }
  } catch (error) {
    console.error('Error getting session:', error.message)
    return { session: null, error: error.message }
  }
}

/**
 * Get the current user
 * @returns {Promise<{user, error}>}
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error

    return { user, error: null }
  } catch (error) {
    console.error('Error getting current user:', error.message)
    return { user: null, error: error.message }
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<{error}>}
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error resetting password:', error.message)
    return { error: error.message }
  }
}

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<{user, error}>}
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error

    return { user: data.user, error: null }
  } catch (error) {
    console.error('Error updating password:', error.message)
    return { user: null, error: error.message }
  }
}

/**
 * Listen to authentication state changes
 * @param {function} callback - Callback function to handle auth state changes
 * @returns {object} Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

export const syncProfileRole = async (user) => {
  if (!user?.id) {
    return { error: new Error('Missing user id') }
  }

  const metadataRole = user.user_metadata?.role

  if (!metadataRole) {
    return { error: null }
  }

  const { error } = await upsertProfile({
    id: user.id,
    username: user.user_metadata?.username,
    role: metadataRole
  })

  return { error }
}
