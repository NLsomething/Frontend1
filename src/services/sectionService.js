import { supabase } from '../lib/supabaseClient'

export const fetchSectionsByBuildingId = async (buildingId) => {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('building_id', buildingId)
      .order('section_name')
    
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export const fetchSectionById = async (sectionId) => {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single()
    
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}
