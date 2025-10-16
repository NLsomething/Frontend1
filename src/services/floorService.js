import { supabase } from '../lib/supabaseClient'

export const fetchFloorsBySectionId = async (sectionId) => {
  try {
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('section_id', sectionId)
      .order('floor_name')
    
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export const fetchFloorById = async (floorId) => {
  try {
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('id', floorId)
      .single()
    
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}
