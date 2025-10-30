import { supabase } from '../lib/supabaseClient'

export const fetchFloorsByBuildingId = async (buildingId) => {
  try {
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('building_id', buildingId)
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
