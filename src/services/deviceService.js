import { supabase } from '../lib/supabaseClient'

/**
 * Fetch all devices for a specific room
 * @param {string} roomId - The UUID of the room
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const fetchDevicesByRoomId = async (roomId) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('room_id', roomId)
      .order('device_name')
    
    return { data, error }
  } catch (err) {
    console.error('Error fetching devices:', err)
    return { data: null, error: err }
  }
}

/**
 * Update a device's output (e.g., lock/unlock)
 * @param {string} deviceId - The UUID of the device
 * @param {string} newOutput - The new output value (e.g., 'locked', 'unlocked')
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const updateDeviceOutput = async (deviceId, newOutput) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .update({ device_output: newOutput })
      .eq('id', deviceId)
      .select()
      .single()
    
    return { data, error }
  } catch (err) {
    console.error('Error updating device:', err)
    return { data: null, error: err }
  }
}

/**
 * Update a device's status (e.g., operational, maintenance, broken)
 * @param {string} deviceId - The UUID of the device
 * @param {string} newStatus - The new status value
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const updateDeviceStatus = async (deviceId, newStatus) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .update({ status: newStatus })
      .eq('id', deviceId)
      .select()
      .single()
    
    return { data, error }
  } catch (err) {
    console.error('Error updating device status:', err)
    return { data: null, error: err }
  }
}
