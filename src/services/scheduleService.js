import { supabase } from '../lib/supabaseClient'

const TABLE = 'room_schedules'

const normalizeScheduleEntry = (entry) => {
  if (!entry) return null

  const room = entry.rooms || entry.room || {}
  const slot = entry.timeslots || entry.timeslot || {}

  const timeslotId = entry.timeslot_id || slot.id || null
  const roomCode = room.room_code || null

  return {
    id: entry.id,
    schedule_date: entry.schedule_date,
    status: entry.status,
    course_name: entry.course_name,
    booked_by: entry.booked_by,
    room_id: entry.room_id,
    room_code: roomCode,
    room_type: room.room_type || null,
    room_name: room.room_name || null,
    bookable: room.bookable,
    timeslot_id: timeslotId,
    slot_id: slot.id || timeslotId,
    slot_order: slot.slot_order,
    slot_type: slot.slot_type || null,
    slot_name: slot.slot_name || null,
    start_time: slot.start_time || null,
    end_time: slot.end_time || null,
    // Legacy compatibility fields
    room_number: roomCode,
    slot_hour: slot.id || timeslotId
  }
}

export const getSchedulesByDate = async (dateString) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      rooms:room_id (
        id,
        room_code,
        room_name,
        room_type,
        bookable
      ),
      timeslots:timeslot_id (
        id,
        slot_name,
        slot_type,
        slot_order,
        start_time,
        end_time
      )
    `)
    .eq('schedule_date', dateString)

  if (error) {
    return { data: [], error }
  }

  const normalized = (data || []).map(normalizeScheduleEntry)

  return { data: normalized, error: null }
}

export const upsertScheduleEntry = async (entry) => {
  const payload = {
    id: entry.id || undefined,
    schedule_date: entry.schedule_date,
    room_id: entry.room_id,
    timeslot_id: entry.timeslot_id,
    status: entry.status,
    course_name: entry.course_name || null,
    booked_by: entry.booked_by || null
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload)
    .select(`
      *,
      rooms:room_id (
        id,
        room_code,
        room_name,
        room_type,
        bookable
      ),
      timeslots:timeslot_id (
        id,
        slot_name,
        slot_type,
        slot_order,
        start_time,
        end_time
      )
    `)
    .maybeSingle()

  return { data: normalizeScheduleEntry(data), error }
}

export const deleteScheduleEntry = async ({ id, schedule_date, room_id, timeslot_id }) => {
  if (!id && (!schedule_date || !room_id || !timeslot_id)) {
    return { error: new Error('Missing identifiers for deleteScheduleEntry') }
  }

  let query = supabase.from(TABLE).delete()

  if (id) {
    query = query.eq('id', id)
  } else {
    query = query
      .eq('schedule_date', schedule_date)
      .eq('room_id', room_id)
      .eq('timeslot_id', timeslot_id)
  }

  const { error } = await query

  return { error }
}
