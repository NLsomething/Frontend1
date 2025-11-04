import { supabase } from '../lib/supabaseClient'

const TABLE = 'room_requests'

const normalizeTimeslot = (slot) => {
  if (!slot) return null
  return {
    id: slot.id,
    slot_name: slot.slot_name,
    slot_type: slot.slot_type,
    slot_order: slot.slot_order,
    start_time: slot.start_time,
    end_time: slot.end_time
  }
}

const normalizeRequest = (request) => {
  if (!request) return null

  const room = request.room || request.rooms
  const startSlot = request.start_timeslot || request.start_timeslot_id || request.start_timeslotRef
  const endSlot = request.end_timeslot || request.end_timeslot_id || request.end_timeslotRef

  return {
    ...request,
    room_id: request.room_id,
    room_code: room?.room_code || null,
    room_number: room?.room_code || null,
    room_name: room?.room_name || null,
    room_type: room?.room_type || null,
    start_timeslot_id: request.start_timeslot_id,
    end_timeslot_id: request.end_timeslot_id,
    start_timeslot: normalizeTimeslot(startSlot),
    end_timeslot: normalizeTimeslot(endSlot)
  }
}

export const createRoomRequest = async (request) => {
  const payload = {
    requester_id: request.requester_id,
    requester_name: request.requester_name,
    requester_email: request.requester_email,
    room_id: request.room_id || request.roomId,
    base_date: request.base_date,
    start_timeslot_id: request.start_timeslot_id || request.start_timeslotId || request.startHour,
    end_timeslot_id: request.end_timeslot_id || request.end_timeslotId || request.endHour,
    week_count: request.week_count,
    course_name: request.course_name || null,
    booked_by: request.booked_by || null,
    notes: request.notes || null,
    status: 'pending'
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select(`
      *,
      room:room_id ( id, room_code, room_name, room_type ),
      start_timeslot:start_timeslot_id ( id, slot_name, slot_type, slot_order, start_time, end_time ),
      end_timeslot:end_timeslot_id ( id, slot_name, slot_type, slot_order, start_time, end_time )
    `)
    .maybeSingle()

  return { data: normalizeRequest(data), error }
}

export const fetchRoomRequests = async ({ status, limit = 50 } = {}) => {
  let query = supabase
    .from(TABLE)
    .select(`
      *,
      room:room_id ( id, room_code, room_name, room_type ),
      start_timeslot:start_timeslot_id ( id, slot_name, slot_type, slot_order, start_time, end_time ),
      end_timeslot:end_timeslot_id ( id, slot_name, slot_type, slot_order, start_time, end_time )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  const normalized = (data || []).map(normalizeRequest)

  return { data: normalized, error }
}

export const updateRoomRequestStatus = async ({
  id,
  status,
  reviewer_id,
  reviewer_name,
  rejection_reason
}) => {
  const payload = {
    status,
    reviewer_id,
    reviewer_name,
    reviewed_at: new Date().toISOString(),
    rejection_reason: rejection_reason || null
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      room:room_id ( id, room_code, room_name, room_type ),
      start_timeslot:start_timeslot_id ( id, slot_name, slot_type, slot_order, start_time, end_time ),
      end_timeslot:end_timeslot_id ( id, slot_name, slot_type, slot_order, start_time, end_time )
    `)
    .maybeSingle()

  return { data: normalizeRequest(data), error }
}
