import { supabase } from '../lib/supabaseClient'

export const createProfile = async ({ id, username, role }) => {
  if (!id) {
    throw new Error('Missing user id when creating profile')
  }

  const profilePayload = {
    id,
    role,
    username: username || null
  }

  const { error } = await supabase
    .from('profiles')
    .insert(profilePayload)
    .select()
    .single()

  if (error && error.code !== '23505') {
    throw error
  }

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
