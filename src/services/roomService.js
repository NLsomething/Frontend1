import { supabase } from '../lib/supabaseClient'

export const fetchRoomsByFloorId = async (floorId) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('floor_id', floorId)
      .order('room_name')
    
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export const fetchRoomById = async (roomId) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export const fetchRoomsByBuildingId = async (buildingId) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        floors!inner(
          id,
          floor_name,
          building_id
        )
      `)
      .eq('floors.building_id', buildingId)
      .neq('room_type', 'administrative')
      .order('room_name')
    
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}
