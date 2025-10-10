import { supabase } from '../lib/supabaseClient'

const TABLE = 'room_schedules'

export const getSchedulesByDate = async (dateString) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, room_number, slot_hour, status, course_name, booked_by')
    .eq('schedule_date', dateString)

  return { data: data || [], error }
}

export const upsertScheduleEntry = async (entry) => {
  const payload = {
    id: entry.id || undefined,
    schedule_date: entry.schedule_date,
    room_number: entry.room_number,
    slot_hour: entry.slot_hour,
    status: entry.status,
    course_name: entry.course_name || null,
    booked_by: entry.booked_by || null
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'schedule_date,room_number,slot_hour' })
    .select()
    .maybeSingle()

  return { data, error }
}

export const deleteScheduleEntry = async ({ schedule_date, room_number, slot_hour }) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('schedule_date', schedule_date)
    .eq('room_number', room_number)
    .eq('slot_hour', slot_hour)

  return { error }
}
