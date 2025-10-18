import { supabase } from '../lib/supabaseClient'

export const createProfile = async ({ id, username, role }) => {
  if (!id) {
    throw new Error('Missing user id when creating profile')
  }

  if (!role) {
    throw new Error('Missing role when creating profile')
  }

  const profilePayload = {
    id,
    role,
    username: username || null
  }

  console.log('Inserting profile:', profilePayload)

  const { data, error } = await supabase
    .from('profiles')
    .insert(profilePayload)
    .select()
    .single()

  if (error) {
    console.error('Supabase profile insert error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    
    if (error.code === '23505') {
      // Duplicate key - profile already exists
      console.log('Profile already exists, ignoring duplicate error')
      return { error: null }
    }
    
    throw error
  }

  console.log('Profile inserted successfully:', data)
  return { error: null }
}

export const getProfile = async (userId) => {
  if (!userId) {
    return { data: null, error: new Error('Missing user id') }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, username')
    .eq('id', userId)
    .maybeSingle()

  return { data, error }
}

export const upsertProfile = async ({ id, username, role }) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id, username: username || null, role })
    .select()
    .maybeSingle()

  return { data, error }
}
