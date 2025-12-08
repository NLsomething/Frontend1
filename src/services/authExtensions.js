// Additional authentication features you can implement
// This file contains example code for extending your auth system

import { supabase } from '../lib/supabaseClient'

/**
 * SOCIAL LOGIN EXAMPLE
 * Enable in Supabase Dashboard: Authentication > Providers
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`
      }
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error signing in with Google:', error.message)
    return { data: null, error: error.message }
  }
}

export const signInWithGithub = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/home`
      }
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error signing in with GitHub:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * UPDATE USER PROFILE
 * Update user metadata
 */
export const updateUserProfile = async (updates) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })
    
    if (error) throw error
    return { user: data.user, error: null }
  } catch (error) {
    console.error('Error updating profile:', error.message)
    return { user: null, error: error.message }
  }
}

/**
 * PHONE AUTHENTICATION EXAMPLE
 * Enable in Supabase Dashboard: Authentication > Providers > Phone
 */
export const signInWithPhone = async (phone, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password
    })
    
    if (error) throw error
    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing in with phone:', error.message)
    return { user: null, session: null, error: error.message }
  }
}

export const signUpWithPhone = async (phone, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      phone,
      password
    })
    
    if (error) throw error
    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Error signing up with phone:', error.message)
    return { user: null, session: null, error: error.message }
  }
}

/**
 * VERIFY OTP
 * For phone or email verification
 */
export const verifyOTP = async (phone, token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })
    
    if (error) throw error
    return { session: data.session, error: null }
  } catch (error) {
    console.error('Error verifying OTP:', error.message)
    return { session: null, error: error.message }
  }
}

/**
 * REFRESH SESSION
 * Manually refresh the session
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) throw error
    return { session: data.session, error: null }
  } catch (error) {
    console.error('Error refreshing session:', error.message)
    return { session: null, error: error.message }
  }
}

/**
 * CHECK IF EMAIL EXISTS
 * Checks if an email exists in auth.users via RPC function
 * Requires the check_email_exists() function to be created in Supabase
 */
export const checkEmailExists = async (email) => {
  try {
    // Call the RPC function to check if email exists in auth.users
    const { data, error } = await supabase
      .rpc('check_email_exists', { p_email: email })
    
    if (error) {
      console.error('Error checking email existence:', error.message)
      // If there's an error calling the RPC, assume exists to allow normal login flow
      return { exists: true, error: null }
    }
    
    // data is an array with one row containing { exists: boolean }
    const emailExists = data && data.length > 0 ? data[0].exists : false
    return { exists: emailExists, error: null }
  } catch (error) {
    console.error('Error checking email existence:', error.message)
    // On error, assume exists to allow normal login flow
    return { exists: true, error: error.message }
  }
}

/**
 * RESEND CONFIRMATION EMAIL
 */
export const resendConfirmationEmail = async (email) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })
    
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error resending confirmation:', error.message)
    return { error: error.message }
  }
}

/**
 * MAGIC LINK LOGIN
 * Passwordless authentication via email
 */
export const signInWithMagicLink = async (email) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/home`
      }
    })
    
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error sending magic link:', error.message)
    return { error: error.message }
  }
}

/**
 * SET UP MULTI-FACTOR AUTHENTICATION (MFA)
 * Requires Supabase Pro plan
 */
export const enrollMFA = async () => {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error enrolling MFA:', error.message)
    return { data: null, error: error.message }
  }
}

export const verifyMFA = async (factorId, code) => {
  try {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error verifying MFA:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * DELETE ACCOUNT
 * Note: This requires RLS policies and a database function
 */
export const deleteAccount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('No user logged in')
    
    // You need to create this function in Supabase
    const { error } = await supabase.rpc('delete_user_account')
    
    if (error) throw error
    
    await supabase.auth.signOut()
    return { error: null }
  } catch (error) {
    console.error('Error deleting account:', error.message)
    return { error: error.message }
  }
}

/**
 * GET USER METADATA
 */
export const getUserMetadata = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    return { metadata: user?.user_metadata, error: null }
  } catch (error) {
    console.error('Error getting user metadata:', error.message)
    return { metadata: null, error: error.message }
  }
}
