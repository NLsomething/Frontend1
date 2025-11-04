import { supabase } from '../lib/supabaseClient'

export const fetchTimeslots = async () => {
  const { data, error } = await supabase
    .from('timeslots')
    .select('id, slot_name, slot_type, slot_order, start_time, end_time')
    .order('slot_order', { ascending: true })

  if (error) {
    return { data: [], error }
  }

  const normalized = (data || []).map((slot) => ({
    id: slot.id,
    slotName: slot.slot_name,
    slot_type: slot.slot_type,
    slotType: slot.slot_type,
    slot_order: slot.slot_order,
    slotOrder: slot.slot_order,
    start_time: slot.start_time,
    startTime: slot.start_time,
    end_time: slot.end_time,
    endTime: slot.end_time,
    label: slot.slot_name,
    displayLabel: slot.start_time && slot.end_time
      ? `${slot.slot_name} • ${slot.start_time} – ${slot.end_time}`
      : slot.slot_name
  }))

  return { data: normalized, error: null }
}
