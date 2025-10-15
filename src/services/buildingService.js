import { supabase } from '../lib/supabaseClient'

export async function fetchBuildings() {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .order('building_code', { ascending: true })
    
    if (error) {
      console.error('Error fetching buildings:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error fetching buildings:', err)
    return { data: null, error: err.message }
  }
}

export async function fetchBuildingByCode(buildingCode) {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('building_code', buildingCode)
      .single()
    
    if (error) {
      console.error('Error fetching building:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error fetching building:', err)
    return { data: null, error: err.message }
  }
}

export async function fetchBuildingById(buildingId) {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', buildingId)
      .single()
    
    if (error) {
      console.error('Error fetching building:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error fetching building:', err)
    return { data: null, error: err.message }
  }
}
